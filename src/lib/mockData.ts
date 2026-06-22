// ============================================================
// LingoBite - Mock Data Service
// Pre-loaded realistic demo content for all lesson types
// ============================================================

import type {
  Lesson,
  Badge,
  StudentSubmission,
  PeerReview,
  UserProfile,
} from '@/types';

export const MOCK_TEACHER: UserProfile = {
  uid: 'teacher_001',
  email: 'sarah.johnson@lingobite.edu',
  displayName: 'Sarah Johnson',
  photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  role: 'teacher',
  createdAt: new Date('2024-01-15'),
  lastLoginAt: new Date(),
  badges: [],
  totalScore: 0,
  lessonsCompleted: 0,
  currentStreak: 0,
};

export const MOCK_STUDENT: UserProfile = {
  uid: 'student_001',
  email: 'alex.rivera@email.com',
  displayName: 'Alex Rivera',
  photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face',
  role: 'student',
  createdAt: new Date('2024-02-01'),
  lastLoginAt: new Date(),
  badges: ['badge_001', 'badge_003', 'badge_007'],
  totalScore: 2450,
  lessonsCompleted: 12,
  currentStreak: 5,
};

// --- Pronunciation Lessons ---
export const PRONUNCIATION_LESSONS: Lesson[] = [
  {
    id: 'pron_lesson_001',
    title: 'TH Sounds: Think vs. This',
    description: 'Master the voiced and voiceless TH sounds with tongue placement techniques.',
    type: 'pronunciation',
    youtubeUrl: 'https://www.youtube.com/embed/3X_1bAV3LfM',
    teacherId: 'teacher_001',
    teacherName: 'Sarah Johnson',
    status: 'published',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
    order: 1,
    items: [
      { id: 'p1', type: 'pronunciation', order: 1, instructions: 'Listen and repeat: "Think carefully before you speak."', targetPhrase: 'Think carefully before you speak.', nativeAudioUrl: '/audio/think_carefully.mp3', hint: 'Place tongue between teeth, blow air out' },
      { id: 'p2', type: 'pronunciation', order: 2, instructions: 'Listen and repeat: "This is the third time."', targetPhrase: 'This is the third time.', nativeAudioUrl: '/audio/third_time.mp3', hint: 'Voiced TH - feel vibration in throat' },
      { id: 'p3', type: 'pronunciation', order: 3, instructions: 'Listen and repeat: "Thirty-three thoughtful thieves."', targetPhrase: 'Thirty-three thoughtful thieves.', nativeAudioUrl: '/audio/thirty_thieves.mp3', hint: 'Tongue twister - start slow!' },
      { id: 'p4', type: 'pronunciation', order: 4, instructions: 'Listen and repeat: "The weather is rather warm."', targetPhrase: 'The weather is rather warm.', nativeAudioUrl: '/audio/weather_warm.mp3', hint: 'Smooth transition between TH sounds' },
      { id: 'p5', type: 'pronunciation', order: 5, instructions: 'Listen and repeat: "I thought nothing of it."', targetPhrase: 'I thought nothing of it.', nativeAudioUrl: '/audio/thought_nothing.mp3' },
      { id: 'p6', type: 'pronunciation', order: 6, instructions: 'Listen and repeat: "Both brothers bathe together."', targetPhrase: 'Both brothers bathe together.', nativeAudioUrl: '/audio/brothers_bathe.mp3', hint: 'Switch between voiceless and voiced TH' },
      { id: 'p7', type: 'pronunciation', order: 7, instructions: 'Listen and repeat: "Something is better than nothing."', targetPhrase: 'Something is better than nothing.', nativeAudioUrl: '/audio/something_better.mp3' },
      { id: 'p8', type: 'pronunciation', order: 8, instructions: 'Listen and repeat: "Theo threw three thick thimbles."', targetPhrase: 'Theo threw three thick thimbles.', nativeAudioUrl: '/audio/theo_threw.mp3', hint: 'Multiple voiceless TH challenge' },
      { id: 'p9', type: 'pronunciation', order: 9, instructions: 'Listen and repeat: "They are neither here nor there."', targetPhrase: 'They are neither here nor there.', nativeAudioUrl: '/audio/neither_here.mp3' },
      { id: 'p10', type: 'pronunciation', order: 10, instructions: 'Listen and repeat: "Through thick and thin, we thrive."', targetPhrase: 'Through thick and thin, we thrive.', nativeAudioUrl: '/audio/through_thick.mp3', hint: 'Final challenge - pace yourself' },
    ],
  },
  {
    id: 'pron_lesson_002',
    title: 'R & L Sound Distinction',
    description: 'Distinguish between tricky R and L sounds in English pronunciation.',
    type: 'pronunciation',
    youtubeUrl: 'https://www.youtube.com/embed/3X_1bAV3LfM',
    teacherId: 'teacher_001',
    teacherName: 'Sarah Johnson',
    status: 'published',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12'),
    order: 2,
    items: [
      { id: 'rl1', type: 'pronunciation', order: 1, instructions: 'Listen and repeat: "Red roses rarely last long."', targetPhrase: 'Red roses rarely last long.', nativeAudioUrl: '/audio/red_roses.mp3' },
      { id: 'rl2', type: 'pronunciation', order: 2, instructions: 'Listen and repeat: "Light the lamp on the left."', targetPhrase: 'Light the lamp on the left.', nativeAudioUrl: '/audio/light_lamp.mp3' },
      { id: 'rl3', type: 'pronunciation', order: 3, instructions: 'Listen and repeat: "Read the right route carefully."', targetPhrase: 'Read the right route carefully.', nativeAudioUrl: '/audio/read_right.mp3' },
      { id: 'rl4', type: 'pronunciation', order: 4, instructions: 'Listen and repeat: "Larry really likes rare ribs."', targetPhrase: 'Larry really likes rare ribs.', nativeAudioUrl: '/audio/larry_likes.mp3' },
      { id: 'rl5', type: 'pronunciation', order: 5, instructions: 'Listen and repeat: "The rally rolled right along."', targetPhrase: 'The rally rolled right along.', nativeAudioUrl: '/audio/rally_rolled.mp3' },
      { id: 'rl6', type: 'pronunciation', order: 6, instructions: 'Listen and repeat: "Rachel rarely collects labels."', targetPhrase: 'Rachel rarely collects labels.', nativeAudioUrl: '/audio/rachel_labels.mp3' },
      { id: 'rl7', type: 'pronunciation', order: 7, instructions: 'Listen and repeat: "Real leaders learn from results."', targetPhrase: 'Real leaders learn from results.', nativeAudioUrl: '/audio/leaders_learn.mp3' },
      { id: 'rl8', type: 'pronunciation', order: 8, instructions: 'Listen and repeat: "The river runs through the valley."', targetPhrase: 'The river runs through the valley.', nativeAudioUrl: '/audio/river_valley.mp3' },
      { id: 'rl9', type: 'pronunciation', order: 9, instructions: 'Listen and repeat: "Road rules regulate traffic."', targetPhrase: 'Road rules regulate traffic.', nativeAudioUrl: '/audio/road_rules.mp3' },
      { id: 'rl10', type: 'pronunciation', order: 10, instructions: 'Listen and repeat: "Let\'s rely on real loyalty."', targetPhrase: "Let's rely on real loyalty.", nativeAudioUrl: '/audio/rely_loyalty.mp3' },
    ],
  },
];

// --- Vocabulary Lessons ---
export const VOCABULARY_LESSONS: Lesson[] = [
  {
    id: 'vocab_lesson_001',
    title: 'Advanced Business Vocabulary',
    description: 'Learn essential business terms used in professional environments.',
    type: 'vocabulary',
    youtubeUrl: 'https://www.youtube.com/embed/BT_8ItpZ1Vo',
    teacherId: 'teacher_001',
    teacherName: 'Sarah Johnson',
    status: 'published',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-18'),
    order: 1,
    items: [
      { id: 'v1', type: 'vocab_fillin', order: 1, instructions: 'Complete the sentence with the correct business term.', sentenceTemplate: 'We need to ____ our market share by 15% this quarter.', correctAnswers: ['increase'], acceptableAnswers: [['expand', 'grow', 'boost']], blankCount: 1 },
      { id: 'v2', type: 'vocab_mcq', order: 2, instructions: 'Choose the correct definition for "stakeholder".', question: 'A "stakeholder" in business refers to:', options: ['Someone who holds stakes in gambling', 'A person with an interest or concern in a company', 'A type of financial investment', 'A company shareholder exclusively'], correctOptionIndex: 1, explanation: 'Stakeholders include employees, customers, suppliers, and communities - not just shareholders.' },
      { id: 'v3', type: 'vocab_fillin', order: 3, instructions: 'Fill in the missing words related to financial reporting.', sentenceTemplate: 'The company reported a net ____ of $2.4 million, exceeding Wall Street _____.', correctAnswers: ['profit', 'expectations'], acceptableAnswers: [['earnings', 'income', 'revenue'], ['projections', 'estimates', 'forecasts']], blankCount: 2 },
      { id: 'v4', type: 'vocab_image', order: 4, instructions: 'Label the parts of a professional business email shown in the image.', imageUrl: '/images/business_email.png', annotations: [{ id: 'a1', x: 15, y: 12, label: 'Subject Line', description: 'Clear, concise summary' }, { id: 'a2', x: 15, y: 28, label: 'Salutation', description: 'Professional greeting' }, { id: 'a3', x: 15, y: 52, label: 'Call to Action', description: 'What you want recipient to do' }, { id: 'a4', x: 15, y: 72, label: 'Professional Closing', description: 'Sign-off etiquette' }] },
      { id: 'v5', type: 'vocab_mcq', order: 5, instructions: 'Select the best synonym for "leverage" in a business context.', question: 'In business, "leverage" most closely means:', options: ['To borrow money', 'To utilize something to maximum advantage', 'To lift heavy objects', 'To balance accounts'], correctOptionIndex: 1 },
      { id: 'v6', type: 'vocab_fillin', order: 6, instructions: 'Complete this negotiation vocabulary sentence.', sentenceTemplate: 'We managed to reach a mutually beneficial ____ that satisfied both _____.', correctAnswers: ['agreement', 'parties'], acceptableAnswers: [['compromise', 'deal', 'settlement'], ['sides', 'teams', 'groups']], blankCount: 2 },
    ],
  },
];

// --- Grammar Lessons ---
export const GRAMMAR_LESSONS: Lesson[] = [
  {
    id: 'grammar_lesson_001',
    title: 'Conditionals: Zero, First, Second',
    description: 'Master the three main conditional forms in English grammar.',
    type: 'grammar',
    youtubeUrl: 'https://www.youtube.com/embed/VuzUvxGnH88',
    teacherId: 'teacher_001',
    teacherName: 'Sarah Johnson',
    status: 'published',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-22'),
    order: 1,
    items: [
      { id: 'g1', type: 'grammar_mcq', order: 1, instructions: 'Choose the correct conditional form.', question: 'If you heat water to 100°C, it _____.', options: ['will boil', 'would boil', 'boils', 'boiled'], correctOptionIndex: 2, explanation: 'Zero conditional for universal truths: If + present simple, present simple.', grammarRule: 'Zero Conditional' },
      { id: 'g2', type: 'grammar_mcq', order: 2, instructions: 'Identify the correct first conditional sentence.', question: 'Which sentence is a correct first conditional?', options: ['If I win the lottery, I would buy a yacht.', 'If I see him, I will tell him.', 'If I saw him, I would tell him.', 'If I had seen him, I would have told him.'], correctOptionIndex: 1, explanation: 'First conditional: If + present simple, will + base verb (real possibility).', grammarRule: 'First Conditional' },
      { id: 'g3', type: 'grammar_sentence', order: 3, instructions: 'Create a sentence using the second conditional. Imagine you had a million dollars.', prompt: 'If I had a million dollars, ...', wordBank: ['travel', 'around', 'world', 'buy', 'house', 'invest', 'help', 'family', 'quit', 'job'], targetGrammarRule: 'Second Conditional', minWordCount: 6, exampleAnswer: 'If I had a million dollars, I would travel around the world and help my family.' },
      { id: 'g4', type: 'grammar_mcq', order: 4, instructions: 'Complete the second conditional correctly.', question: 'If I ____ fluent in English, I ____ for that international position.', options: ['am / will apply', 'were / would apply', 'had been / would have applied', 'be / would apply'], correctOptionIndex: 1, explanation: 'Second conditional: If + past simple, would + base verb (hypothetical).', grammarRule: 'Second Conditional' },
      { id: 'g5', type: 'grammar_sentence', order: 5, instructions: 'Write about an unreal present situation using second conditional.', prompt: 'If I lived in a big city, ...', wordBank: ['take', 'subway', 'every', 'day', 'visit', 'museums', 'eat', 'restaurants', 'meet', 'interesting', 'people'], targetGrammarRule: 'Second Conditional', minWordCount: 5, exampleAnswer: 'If I lived in a big city, I would take the subway every day and visit museums.' },
      { id: 'g6', type: 'grammar_mcq', order: 6, instructions: 'Choose the correct mixed conditional.', question: 'If I had studied harder, I ____ better grades now.', options: ['would have', 'would have had', 'would have better', 'have'], correctOptionIndex: 0, explanation: 'Mixed conditional: Past condition with present result.', grammarRule: 'Mixed Conditional' },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = [...PRONUNCIATION_LESSONS, ...VOCABULARY_LESSONS, ...GRAMMAR_LESSONS];

// --- Badges ---
export const BADGES: Badge[] = [
  { id: 'badge_001', name: 'First Steps', description: 'Complete your first lesson', imageUrl: '/badges/first_steps.png', criteria: { type: 'count', threshold: 1 }, category: 'milestone', tier: 'bronze' },
  { id: 'badge_002', name: 'Pronunciation Rookie', description: 'Complete 5 pronunciation lessons', imageUrl: '/badges/pron_rookie.png', criteria: { type: 'count', threshold: 5, lessonType: 'pronunciation' }, category: 'pronunciation', tier: 'bronze' },
  { id: 'badge_003', name: 'Perfect Pitch', description: 'Get a perfect 10/10 pronunciation score', imageUrl: '/badges/perfect_pitch.png', criteria: { type: 'perfect_score', threshold: 10, lessonType: 'pronunciation' }, category: 'pronunciation', tier: 'silver' },
  { id: 'badge_004', name: 'Word Wizard', description: 'Score 100% on 3 vocabulary MCQ sets', imageUrl: '/badges/word_wizard.png', criteria: { type: 'count', threshold: 3, lessonType: 'vocabulary' }, category: 'vocabulary', tier: 'silver' },
  { id: 'badge_005', name: 'Grammar Guardian', description: 'Complete all grammar lessons with 80%+', imageUrl: '/badges/grammar_guardian.png', criteria: { type: 'score_threshold', threshold: 80, lessonType: 'grammar' }, category: 'grammar', tier: 'gold' },
  { id: 'badge_006', name: '5-Day Streak', description: 'Practice 5 days in a row', imageUrl: '/badges/streak_5.png', criteria: { type: 'streak', threshold: 5 }, category: 'engagement', tier: 'bronze' },
  { id: 'badge_007', name: 'Peer Reviewer', description: 'Leave 5 emoji reactions on peer submissions', imageUrl: '/badges/peer_reviewer.png', criteria: { type: 'peer_reviews', threshold: 5 }, category: 'engagement', tier: 'bronze' },
  { id: 'badge_008', name: 'Community Champion', description: 'Leave 20 helpful peer reactions', imageUrl: '/badges/community_champ.png', criteria: { type: 'peer_reviews', threshold: 20 }, category: 'engagement', tier: 'gold' },
  { id: 'badge_009', name: 'Pronunciation Master', description: 'Complete 10 pronunciation lessons with avg 8+', imageUrl: '/badges/pron_master.png', criteria: { type: 'count', threshold: 10, lessonType: 'pronunciation' }, category: 'pronunciation', tier: 'platinum' },
  { id: 'badge_010', name: 'LingoBite Legend', description: 'Complete 50 lessons across all categories', imageUrl: '/badges/legend.png', criteria: { type: 'count', threshold: 50 }, category: 'milestone', tier: 'platinum' },
];

// --- Mock Submissions for Teacher Dashboard ---
export const MOCK_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub_001',
    studentId: 'student_001',
    studentName: 'Alex Rivera',
    studentPhotoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
    lessonId: 'pron_lesson_001',
    lessonTitle: 'TH Sounds: Think vs. This',
    lessonType: 'pronunciation',
    status: 'submitted',
    startedAt: new Date('2024-06-20T10:00:00'),
    submittedAt: new Date('2024-06-20T10:25:00'),
    maxScore: 100,
    answers: [
      { itemId: 'p1', itemType: 'pronunciation', itemOrder: 1, recordedAudioUrl: '#', durationSeconds: 4.2, teacherScore: undefined },
      { itemId: 'p2', itemType: 'pronunciation', itemOrder: 2, recordedAudioUrl: '#', durationSeconds: 3.8, teacherScore: undefined },
      { itemId: 'p3', itemType: 'pronunciation', itemOrder: 3, recordedAudioUrl: '#', durationSeconds: 6.1, teacherScore: undefined },
      { itemId: 'p4', itemType: 'pronunciation', itemOrder: 4, recordedAudioUrl: '#', durationSeconds: 4.5, teacherScore: undefined },
      { itemId: 'p5', itemType: 'pronunciation', itemOrder: 5, recordedAudioUrl: '#', durationSeconds: 3.9, teacherScore: undefined },
      { itemId: 'p6', itemType: 'pronunciation', itemOrder: 6, recordedAudioUrl: '#', durationSeconds: 5.2, teacherScore: undefined },
      { itemId: 'p7', itemType: 'pronunciation', itemOrder: 7, recordedAudioUrl: '#', durationSeconds: 4.0, teacherScore: undefined },
      { itemId: 'p8', itemType: 'pronunciation', itemOrder: 8, recordedAudioUrl: '#', durationSeconds: 5.8, teacherScore: undefined },
      { itemId: 'p9', itemType: 'pronunciation', itemOrder: 9, recordedAudioUrl: '#', durationSeconds: 4.3, teacherScore: undefined },
      { itemId: 'p10', itemType: 'pronunciation', itemOrder: 10, recordedAudioUrl: '#', durationSeconds: 5.0, teacherScore: undefined },
    ],
    competenceFlags: [],
    flawFlags: [],
    emailSent: false,
  },
  {
    id: 'sub_002',
    studentId: 'student_002',
    studentName: 'Maria Chen',
    studentPhotoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    lessonId: 'grammar_lesson_001',
    lessonTitle: 'Conditionals: Zero, First, Second',
    lessonType: 'grammar',
    status: 'submitted',
    startedAt: new Date('2024-06-20T11:00:00'),
    submittedAt: new Date('2024-06-20T11:20:00'),
    maxScore: 60,
    answers: [
      { itemId: 'g1', itemType: 'grammar_mcq', itemOrder: 1, selectedOptionIndex: 2, isCorrect: true },
      { itemId: 'g2', itemType: 'grammar_mcq', itemOrder: 2, selectedOptionIndex: 1, isCorrect: true },
      { itemId: 'g3', itemType: 'grammar_sentence', itemOrder: 3, sentence: 'If I had a million dollars, I would buy a big house and travel the world.', wordsUsed: ['buy', 'house', 'travel', 'world'], teacherScore: undefined },
      { itemId: 'g4', itemType: 'grammar_mcq', itemOrder: 4, selectedOptionIndex: 1, isCorrect: true },
      { itemId: 'g5', itemType: 'grammar_sentence', itemOrder: 5, sentence: 'If I lived in a big city, I would meet interesting people every day.', wordsUsed: ['lived', 'meet', 'interesting', 'people'], teacherScore: undefined },
      { itemId: 'g6', itemType: 'grammar_mcq', itemOrder: 6, selectedOptionIndex: 0, isCorrect: true },
    ],
    competenceFlags: [],
    flawFlags: [],
    emailSent: false,
  },
  {
    id: 'sub_003',
    studentId: 'student_003',
    studentName: 'James Wilson',
    studentPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    lessonId: 'vocab_lesson_001',
    lessonTitle: 'Advanced Business Vocabulary',
    lessonType: 'vocabulary',
    status: 'submitted',
    startedAt: new Date('2024-06-19T14:00:00'),
    submittedAt: new Date('2024-06-19T14:30:00'),
    maxScore: 60,
    answers: [
      { itemId: 'v1', itemType: 'vocab_fillin', itemOrder: 1, answers: ['increase'], isCorrect: [true] },
      { itemId: 'v2', itemType: 'vocab_mcq', itemOrder: 2, selectedOptionIndex: 1, isCorrect: true },
      { itemId: 'v3', itemType: 'vocab_fillin', itemOrder: 3, answers: ['profit', 'expectations'], isCorrect: [true, true] },
      { itemId: 'v4', itemType: 'vocab_image', itemOrder: 4, annotations: [{ id: 'sa1', x: 16, y: 13, label: 'Subject' }, { id: 'sa2', x: 16, y: 29, label: 'Greeting' }, { id: 'sa3', x: 16, y: 53, label: 'Action Item' }, { id: 'sa4', x: 16, y: 73, label: 'Closing' }], teacherScore: undefined },
      { itemId: 'v5', itemType: 'vocab_mcq', itemOrder: 5, selectedOptionIndex: 1, isCorrect: true },
      { itemId: 'v6', itemType: 'vocab_fillin', itemOrder: 6, answers: ['deal', 'parties'], isCorrect: [true, true] },
    ],
    competenceFlags: [],
    flawFlags: [],
    emailSent: false,
  },
];

// --- Mock Peer Reviews ---
export const MOCK_PEER_REVIEWS: PeerReview[] = [
  {
    id: 'pr_001',
    submissionId: 'sub_001',
    reviewerId: 'student_002',
    reviewerName: 'CreativePanda_42',
    createdAt: new Date('2024-06-20T12:00:00'),
    emojiReactions: [
      { emoji: '👍', count: 3, userIds: ['s1', 's2', 's3'] },
      { emoji: '🌟', count: 2, userIds: ['s1', 's4'] },
      { emoji: '🔥', count: 1, userIds: ['s2'] },
    ],
    writtenComment: 'Great pronunciation on the tongue twisters! Very impressive.',
  },
  {
    id: 'pr_002',
    submissionId: 'sub_002',
    reviewerId: 'student_003',
    reviewerName: 'GrammarHero_88',
    createdAt: new Date('2024-06-20T13:00:00'),
    emojiReactions: [
      { emoji: '👏', count: 2, userIds: ['s1', 's3'] },
      { emoji: '💡', count: 1, userIds: ['s2'] },
    ],
    writtenComment: 'Your conditional sentences are very well constructed!',
  },
];

// --- Seed function to populate Firestore ---
export const seedFirestoreData = async () => {
  const { setDoc, doc, serverTimestamp } = await import('@/lib/firebase');
  
  for (const lesson of ALL_LESSONS) {
    await setDoc(doc(db, 'lessons', lesson.id), {
      ...lesson,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  for (const badge of BADGES) {
    await setDoc(doc(db, 'badges', badge.id), badge);
  }
  
  console.log('Firestore seeded with demo data');
};

import { db } from '@/lib/firebase';
