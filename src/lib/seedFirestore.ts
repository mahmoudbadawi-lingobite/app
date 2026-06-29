// ============================================================
// LingoBite - One-time Firestore Seed Script
// Run this ONCE by calling seedAll() from the browser console
// or temporarily from a component. Delete after use.
// ============================================================

import { db } from '@/lib/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import {
  PRONUNCIATION_LESSONS,
  VOCABULARY_LESSONS,
  GRAMMAR_LESSONS,
  BADGES,
} from '@/lib/mockData';

export const seedAll = async (): Promise<void> => {
  console.log('🌱 Seeding Firestore...');
  const allLessons = [...PRONUNCIATION_LESSONS, ...VOCABULARY_LESSONS, ...GRAMMAR_LESSONS];

  // Seed lessons in batches (Firestore limit: 500 per batch)
  const lessonBatch = writeBatch(db);
  for (const lesson of allLessons) {
    const { id, ...data } = lesson;
    lessonBatch.set(doc(db, 'lessons', id), {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
  await lessonBatch.commit();
  console.log(`✅ Seeded ${allLessons.length} lessons`);

  // Seed badges
  const badgeBatch = writeBatch(db);
  for (const badge of BADGES) {
    const { id, ...data } = badge;
    badgeBatch.set(doc(db, 'badges', id), data);
  }
  await badgeBatch.commit();
  console.log(`✅ Seeded ${BADGES.length} badges`);

  console.log('🎉 Firestore seeding complete!');
};

// Make it available in browser console for easy one-time use
if (typeof window !== 'undefined') {
  (window as any).seedLingoBite = seedAll;
}
