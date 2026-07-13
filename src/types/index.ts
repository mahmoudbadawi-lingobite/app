// ============================================================
// LingoBite - Complete TypeScript Type Definitions
// ============================================================

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  customAvatarUrl?: string | null;   // Chosen from the in-app avatar picker
  createdAt: Date;
  lastLoginAt: Date;
  badges: string[];           // Array of badge IDs earned
  totalScore: number;
  lessonsCompleted: number;
  currentStreak: number;
}

// --- Lessons ---

export type LessonType = 'pronunciation' | 'vocabulary' | 'grammar' | 'reading';
export type LessonStatus = 'draft' | 'published' | 'archived';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  youtubeUrl: string;
  teacherId: string;
  teacherName: string;
  status: LessonStatus;
  createdAt: Date;
  updatedAt: Date;
  items: LessonItem[];
  order: number;
  // --- Reading Comprehension lessons only ---
  readingPassage?: string;      // The passage text students read before answering
  readingImageUrl?: string;     // Optional supporting image (via link), shown with the passage
}

export type LessonItem =
  | PronunciationItem
  | VocabularyFillInItem
  | VocabularyImageItem
  | VocabularyMCQItem
  | GrammarMCQItem
  | GrammarSentenceItem
  | ReadingMCQItem
  | ReadingTrueFalseItem
  | ReadingEssayItem
  | ReadingShortAnswerItem;

export interface BaseLessonItem {
  id: string;
  type: string;
  order: number;
  instructions: string;
  marks?: number;             // Points this question is worth (teacher-editable, default 1)
}

export interface PronunciationItem extends BaseLessonItem {
  type: 'pronunciation';
  targetPhrase: string;
  nativeAudioUrl: string;     // Reference audio
  hint?: string;
}

export interface VocabularyFillInItem extends BaseLessonItem {
  type: 'vocab_fillin';
  sentenceTemplate: string;   // "The ____ jumped over the ____"
  correctAnswers: string[];   // ["cat", "moon"]
  acceptableAnswers?: string[][]; // Alternative answers per blank
  blankCount: number;
}

export interface VocabularyImageItem extends BaseLessonItem {
  type: 'vocab_image';
  imageUrl: string;
  annotations: ImageAnnotation[]; // Pre-defined correct annotations
  studentAnnotations?: StudentAnnotation[];
}

export interface ImageAnnotation {
  id: string;
  x: number;                  // Percentage 0-100
  y: number;
  label: string;
  description?: string;
}

export interface StudentAnnotation {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface VocabularyMCQItem extends BaseLessonItem {
  type: 'vocab_mcq';
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface GrammarMCQItem extends BaseLessonItem {
  type: 'grammar_mcq';
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  grammarRule?: string;
}

export interface GrammarSentenceItem extends BaseLessonItem {
  type: 'grammar_sentence';
  prompt: string;
  wordBank: string[];         // Words student can use
  targetGrammarRule: string;
  minWordCount: number;
  exampleAnswer?: string;
}

// --- Reading Comprehension ---
// A reading lesson displays one shared passage (+ optional image) at the
// lesson level (see Lesson.readingPassage / readingImageUrl above), then
// asks a mix of the four question types below.

export interface ReadingMCQItem extends BaseLessonItem {
  type: 'reading_mcq';
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface ReadingTrueFalseItem extends BaseLessonItem {
  type: 'reading_tf';
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface ReadingEssayItem extends BaseLessonItem {
  type: 'reading_essay';
  prompt: string;
  minWordCount?: number;
  guidance?: string;          // Optional guidance/rubric shown to the student
}

export interface ReadingShortAnswerItem extends BaseLessonItem {
  type: 'reading_short_answer';
  question: string;
  sampleAnswer?: string;      // Optional model answer, shown to the teacher only
}

// --- Student Submissions ---

export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded';

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhotoURL?: string;
  lessonId: string;
  lessonTitle: string;
  lessonType: LessonType;
  status: SubmissionStatus;
  startedAt: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  gradedBy?: string;
  gradedByName?: string;
  answers: StudentAnswer[];
  totalScore?: number;
  maxScore: number;
  teacherWrittenFeedback?: string;
  teacherAudioFeedbackUrl?: string;
  competenceFlags: string[];   // Areas of strength
  flawFlags: string[];         // Areas needing improvement
  emailSent?: boolean;
  emailSentAt?: Date;
}

export type StudentAnswer =
  | PronunciationAnswer
  | FillInAnswer
  | ImageAnnotationAnswer
  | MCQAnswer
  | SentenceAnswer
  | TrueFalseAnswer
  | EssayAnswer
  | ShortAnswerAnswer;

export interface BaseStudentAnswer {
  itemId: string;
  itemType: string;
  itemOrder: number;
  teacherComment?: string;
}

export interface PronunciationAnswer extends BaseStudentAnswer {
  itemType: 'pronunciation';
  recordedAudioUrl: string;
  durationSeconds: number;
  teacherScore?: number;      // 0-10
  teacherComment?: string;
}

export interface FillInAnswer extends BaseStudentAnswer {
  itemType: 'vocab_fillin';
  answers: string[];          // Student's filled answers per blank
  isCorrect: boolean[];       // Auto-graded per blank
}

export interface ImageAnnotationAnswer extends BaseStudentAnswer {
  itemType: 'vocab_image';
  annotations: StudentAnnotation[];
  teacherScore?: number;
  teacherComment?: string;
}

export interface MCQAnswer extends BaseStudentAnswer {
  itemType: 'vocab_mcq' | 'grammar_mcq' | 'reading_mcq';
  selectedOptionIndex: number;
  isCorrect: boolean;         // Auto-graded
}

export interface SentenceAnswer extends BaseStudentAnswer {
  itemType: 'grammar_sentence';
  sentence: string;
  wordsUsed: string[];
  teacherScore?: number;
  teacherComment?: string;
}

export interface TrueFalseAnswer extends BaseStudentAnswer {
  itemType: 'reading_tf';
  selectedAnswer: boolean;
  isCorrect: boolean;         // Auto-graded
}

export interface EssayAnswer extends BaseStudentAnswer {
  itemType: 'reading_essay';
  response: string;
  teacherScore?: number;      // Manually graded, 0-item.marks
  teacherComment?: string;
}

export interface ShortAnswerAnswer extends BaseStudentAnswer {
  itemType: 'reading_short_answer';
  response: string;
  teacherScore?: number;      // Manually graded, 0-item.marks
  teacherComment?: string;
}

// --- Peer Reviews ---

export interface PeerReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;       // The reviewer's registered display name
  reviewerPhotoURL?: string | null; // The reviewer's registered profile picture
  createdAt: Date;
  emojiReactions: EmojiReaction[];
  writtenComment?: string;
}

// --- In-App Notifications ---

export type NotificationType = 'peer_comment' | 'submission_graded' | 'peer_review_posted' | 'peer_review_reported';

export interface AppNotification {
  id: string;
  recipientId: string;        // uid of the user who should see this notification
  type: NotificationType;
  submissionId: string;
  lessonTitle: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL?: string | null;
  commentPreview: string;
  read: boolean;
  createdAt: Date;
}

export interface EmojiReaction {
  emoji: string;              // 👍 🌟 👏 🔥 ❤️ 💡
  count: number;
  userIds: string[];
}

// --- Badges / Achievements ---

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: BadgeCriteria;
  category: 'pronunciation' | 'vocabulary' | 'grammar' | 'reading' | 'engagement' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface BadgeCriteria {
  type: 'score_threshold' | 'streak' | 'count' | 'peer_reviews' | 'perfect_score' | 'perfect_count' | 'category_coverage';
  threshold: number;
  lessonType?: LessonType;
}

export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
  relatedLessonId?: string;
}

// --- Audio Recording ---

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;           // Seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  mimeType: string;
}

export interface AudioLevelData {
  average: number;
  peak: number;
  levels: number[];           // History for visualizer
}

// --- Notifications ---

export interface NotificationPayload {
  toEmail: string;
  studentName: string;
  lessonTitle: string;
  score: number;
  maxScore: number;
  writtenFeedback?: string;
  hasAudioFeedback: boolean;
  competenceFlags: string[];
  flawFlags: string[];
  gradedAt: Date;
}
