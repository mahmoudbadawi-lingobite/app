// ============================================================
// LingoBite - One-time Firestore Seed Script
// Open browser console and run: await seedLingoBite()
// ============================================================

import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import {
  PRONUNCIATION_LESSONS,
  VOCABULARY_LESSONS,
  GRAMMAR_LESSONS,
  BADGES,
} from '@/lib/mockData';

// Firestore doesn't support nested arrays — flatten them to JSON strings
const sanitize = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === 'acceptableAnswers' && Array.isArray(value)) {
        // Convert nested array to JSON string to avoid Firestore limitation
        result[key] = JSON.stringify(value);
      } else {
        result[key] = sanitize(value);
      }
    }
    return result;
  }
  return obj;
};

export const seedAll = async (): Promise<void> => {
  console.log('🌱 Seeding Firestore...');
  const allLessons = [...PRONUNCIATION_LESSONS, ...VOCABULARY_LESSONS, ...GRAMMAR_LESSONS];

  const lessonBatch = writeBatch(db);
  for (const lesson of allLessons) {
    const { id, ...data } = lesson;
    lessonBatch.set(doc(db, 'lessons', id), sanitize({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    }) as Record<string, unknown>);
  }
  await lessonBatch.commit();
  console.log(`✅ Seeded ${allLessons.length} lessons`);

  const badgeBatch = writeBatch(db);
  for (const badge of BADGES) {
    const { id, ...data } = badge;
    badgeBatch.set(doc(db, 'badges', id), data);
  }
  await badgeBatch.commit();
  console.log(`✅ Seeded ${BADGES.length} badges`);

  console.log('🎉 Firestore seeding complete!');
};

if (typeof window !== 'undefined') {
  (window as any).seedLingoBite = seedAll;
}
