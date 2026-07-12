// ============================================================
// LingoBite - Firebase Configuration & Services
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  addDoc,
  onSnapshot,
  writeBatch,
  increment,
  arrayUnion,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDxFfa9PmUKdZlL1fOLTNoMmmUkI7nsZNE",
  authDomain: "lingobite-app.firebaseapp.com",
  projectId: "lingobite-app",
  storageBucket: "lingobite-app.firebasestorage.app",
  messagingSenderId: "690209347942",
  appId: "1:690209347942:web:780cc79a0f67dc4a0dd0a7",
};

// --- Initialize ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- Auth Helpers ---
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutUser = () => signOut(auth);
export const onAuthChange = (cb: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, cb);

// --- Firestore Helpers ---
export const createUserProfile = async (
  user: FirebaseUser,
  role: 'student' | 'teacher' = 'student'
) => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL,
      customAvatarUrl: null,
      role,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      badges: [],
      totalScore: 0,
      lessonsCompleted: 0,
      currentStreak: 0,
    });
  } else {
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
  }
  return userRef;
};

export const getUserProfile = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as DocumentData) : null;
};

export const updateUserAvatar = async (uid: string, avatarUrl: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { customAvatarUrl: avatarUrl });
};

export const getLessons = async (type?: string) => {
  let q = query(
    collection(db, 'lessons'),
    where('status', '==', 'published'),
    orderBy('order', 'asc')
  );
  if (type) {
    q = query(
      collection(db, 'lessons'),
      where('status', '==', 'published'),
      where('type', '==', type),
      orderBy('order', 'asc')
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getLessonById = async (lessonId: string) => {
  const snap = await getDoc(doc(db, 'lessons', lessonId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const deleteLesson = async (lessonId: string) => {
  await deleteDoc(doc(db, 'lessons', lessonId));
};

// Bulk-delete for the teacher dashboard's "select multiple" lessons flow,
// mirroring deleteSubmissions below. Each lesson is deleted independently
// so one failure doesn't block the rest of the batch.
export const deleteLessons = async (lessonIds: string[]) => {
  const results = await Promise.allSettled(
    lessonIds.map(id => deleteDoc(doc(db, 'lessons', id)))
  );
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? lessonIds[i] : null))
    .filter((id): id is string => id !== null);
  if (failed.length > 0) {
    throw new Error(`Failed to delete ${failed.length} lesson(s)`);
  }
};

// Firestore rejects `undefined` field values anywhere, including nested
// inside arrays/objects — strip them out recursively so a stray undefined
// deep inside (e.g. an unset optional field on one item in an array) never
// silently breaks the whole write.
const stripUndefinedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[key] = stripUndefinedDeep(v);
      }
    }
    return cleaned;
  }
  return value;
};

export const createSubmission = async (data: Omit<DocumentData, 'id'>) => {
  return await addDoc(collection(db, 'student_submissions'), {
    ...(stripUndefinedDeep(data) as DocumentData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateSubmission = async (
  submissionId: string,
  data: Partial<DocumentData>
) => {
  const cleanData = stripUndefinedDeep(data) as Record<string, unknown>;
  await updateDoc(doc(db, 'student_submissions', submissionId), {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
};

export const getSubmissionsForLesson = async (lessonId: string) => {
  const q = query(
    collection(db, 'student_submissions'),
    where('lessonId', '==', lessonId),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getStudentSubmissions = async (studentId: string) => {
  const q = query(
    collection(db, 'student_submissions'),
    where('studentId', '==', studentId),
    orderBy('startedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPendingSubmissions = async () => {
  const q = query(
    collection(db, 'student_submissions'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Removes a submission along with any peer reviews and notifications that
// reference it, so a teacher deleting a submission doesn't leave orphaned
// comments/notifications behind. Firestore batches cap at 500 writes, so
// large fan-out (many peer reviews on one submission) is chunked defensively.
const deleteSubmissionCascade = async (submissionId: string, batch: ReturnType<typeof writeBatch>) => {
  batch.delete(doc(db, 'student_submissions', submissionId));

  const reviewsSnap = await getDocs(
    query(collection(db, 'peer_reviews'), where('submissionId', '==', submissionId))
  );
  reviewsSnap.docs.forEach(d => batch.delete(d.ref));

  const notificationsSnap = await getDocs(
    query(collection(db, 'notifications'), where('submissionId', '==', submissionId))
  );
  notificationsSnap.docs.forEach(d => batch.delete(d.ref));
};

export const deleteSubmission = async (submissionId: string) => {
  const batch = writeBatch(db);
  await deleteSubmissionCascade(submissionId, batch);
  await batch.commit();
};

// Bulk-delete for the teacher dashboard's "select multiple" flow. Each
// submission (plus its related docs) is written to its own batch so a
// single submission with an unusually large number of peer reviews can't
// blow through Firestore's 500-writes-per-batch limit.
export const deleteSubmissions = async (submissionIds: string[]) => {
  for (const submissionId of submissionIds) {
    const batch = writeBatch(db);
    await deleteSubmissionCascade(submissionId, batch);
    await batch.commit();
  }
};

// Teacher-reviewed work from any student, used to power the peer-feedback
// browser. Submissions only become visible to classmates once the teacher
// has graded them — a freshly submitted (but not yet graded) submission is
// still private to the student and their teacher. Filtering out the
// signed-in student's own submissions happens client-side to avoid needing
// an extra composite index for an inequality filter.
export const getSubmissionsForPeerFeedback = async () => {
  const q = query(
    collection(db, 'student_submissions'),
    where('status', '==', 'graded'),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- Peer Reviews ---
export const addPeerReview = async (data: Omit<DocumentData, 'id'>) => {
  return await addDoc(collection(db, 'peer_reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getPeerReviewsForSubmission = async (submissionId: string) => {
  const q = query(
    collection(db, 'peer_reviews'),
    where('submissionId', '==', submissionId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updatePeerReviewReactions = async (
  reviewId: string,
  emojiReactions: { emoji: string; count: number; userIds: string[] }[]
) => {
  await updateDoc(doc(db, 'peer_reviews', reviewId), { emojiReactions });
};

// Reviews a given student has *left* on classmates' work (used for
// student-facing progress/engagement stats).
export const getPeerReviewsByReviewer = async (reviewerId: string) => {
  const q = query(
    collection(db, 'peer_reviews'),
    where('reviewerId', '==', reviewerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- Notifications ---
// Fired whenever a student leaves a peer review comment, so the owner of
// the reviewed submission finds out someone commented on their work.
export const createNotification = async (data: Omit<DocumentData, 'id'>) => {
  return await addDoc(collection(db, 'notifications'), {
    ...(stripUndefinedDeep(data) as DocumentData),
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const getNotificationsForUser = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Live-updating version so the header bell can reflect new notifications
// (and their read/unread state) without a manual refresh.
export const subscribeToNotifications = (
  userId: string,
  callback: (docs: QuerySnapshot<DocumentData>) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, callback);
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

export const markAllNotificationsRead = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};

// --- Badges ---
export const getAllBadges = async () => {
  const snap = await getDocs(
    query(collection(db, 'badges'), orderBy('tier', 'asc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Uses arrayUnion so this is a single atomic Firestore write rather than a
// read-modify-write. That matters because when several badges qualify in
// the same evaluation pass, awardBadgesToUser below fires one write with
// all of them — but this single-badge version stays available for any
// other caller and is itself now race-safe on its own.
export const awardBadgeToUser = async (userId: string, badgeId: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { badges: arrayUnion(badgeId) });
};

// Awards multiple newly-earned badges in a single atomic write. Previously
// each badge was awarded via its own parallel getDoc -> push -> updateDoc,
// so when two+ badges qualified in the same pass (e.g. a first submission
// that was also a perfect score), the writes raced and whichever updateDoc
// finished last silently overwrote the other's badge. arrayUnion collapses
// all of them into one write, so no badge can be lost that way.
export const awardBadgesToUser = async (userId: string, badgeIds: string[]) => {
  if (badgeIds.length === 0) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { badges: arrayUnion(...badgeIds) });
};

export const updateUserStreak = async (userId: string, currentStreak: number) => {
  await updateDoc(doc(db, 'users', userId), { currentStreak });
};

// --- Real-time Subscriptions ---
export const subscribeToSubmissions = (
  studentId: string,
  callback: (docs: QuerySnapshot<DocumentData>) => void
) => {
  const q = query(
    collection(db, 'student_submissions'),
    where('studentId', '==', studentId),
    orderBy('startedAt', 'desc')
  );
  return onSnapshot(q, callback);
};

export const subscribeToPendingSubmissions = (
  callback: (docs: QuerySnapshot<DocumentData>) => void
) => {
  const q = query(
    collection(db, 'student_submissions'),
    where('status', '==', 'submitted'),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(q, callback);
};

// --- Timestamp Helpers ---
export const toDate = (ts: Timestamp | Date | undefined | null | unknown): Date => {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (typeof (ts as any).toDate === 'function') return (ts as any).toDate();
  if (typeof (ts as any).seconds === 'number') return new Date((ts as any).seconds * 1000);
  return new Date(ts as any);
};

export const fmtTimestamp = (ts: Timestamp | Date | undefined): string => {
  const d = toDate(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp, addDoc,
  onSnapshot, writeBatch, increment,
};
