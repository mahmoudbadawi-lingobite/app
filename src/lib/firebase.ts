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

export const createSubmission = async (data: Omit<DocumentData, 'id'>) => {
  return await addDoc(collection(db, 'student_submissions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateSubmission = async (
  submissionId: string,
  data: Partial<DocumentData>
) => {
  await updateDoc(doc(db, 'student_submissions', submissionId), {
    ...data,
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
    where('status', '==', 'submitted'),
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

// --- Badges ---
export const getAllBadges = async () => {
  const snap = await getDocs(
    query(collection(db, 'badges'), orderBy('tier', 'asc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const awardBadgeToUser = async (userId: string, badgeId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const badges = userData.badges || [];
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
    await updateDoc(userRef, { badges });
  }
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
export const toDate = (ts: Timestamp | Date | undefined): Date => {
  if (!ts) return new Date();
  return ts instanceof Date ? ts : ts.toDate();
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
