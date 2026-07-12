// ============================================================
// LingoBite - Badge Evaluation Engine
//
// The Achievements page (BadgeShowcase.tsx) only *displays* badges — it
// never decided who earns them. This module is what actually looks at a
// student's real activity (submissions, peer reviews, streak) and awards
// badges in Firestore. Call `evaluateAndAwardBadges` any time a student
// does something that could unlock a badge (finishing a lesson, leaving a
// peer review, reacting with an emoji).
// ============================================================

import { BADGES } from './mockData';
import {
  getStudentSubmissions,
  getPeerReviewsByReviewer,
  getLessons,
  awardBadgeToUser,
  updateUserStreak,
} from './firebase';
import type { Badge, LessonType, StudentSubmission } from '@/types';

export interface NewlyEarnedBadge {
  id: string;
  name: string;
  tier: Badge['tier'];
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const maybeTimestamp = value as { toDate?: () => Date };
  if (typeof maybeTimestamp.toDate === 'function') return maybeTimestamp.toDate();
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dayKey = (d: Date) => d.toDateString();

// Counts consecutive days (ending today or yesterday, so the streak doesn't
// vanish the instant the clock ticks past midnight) that had at least one
// completed submission.
const computeStreak = (activityDates: Date[]): number => {
  if (activityDates.length === 0) return 0;
  const activeDays = new Set(activityDates.map(dayKey));

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!activeDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * Evaluates every badge's criteria against a student's real Firestore
 * activity, awards any newly-qualified badges, keeps their streak in sync,
 * and returns the badges that were newly unlocked (empty array if none).
 *
 * `knownBadgeIds` should be the badge ids the caller already has cached
 * (e.g. from the signed-in user) so we don't re-award ones they already
 * have.
 */
export const evaluateAndAwardBadges = async (
  userId: string,
  knownBadgeIds: string[] = []
): Promise<NewlyEarnedBadge[]> => {
  const [rawSubmissions, rawPeerReviews, rawLessons] = await Promise.all([
    getStudentSubmissions(userId),
    getPeerReviewsByReviewer(userId).catch(() => []),
    getLessons().catch(() => []),
  ]);

  const submissions = rawSubmissions as StudentSubmission[];
  const completed = submissions.filter(s => s.status === 'submitted' || s.status === 'graded');

  // Published-lesson counts per type, used for "complete ALL lessons of a
  // type" style badges (e.g. Grammar Guardian).
  const publishedCountByType: Partial<Record<LessonType, number>> = {};
  for (const lesson of rawLessons as { type: LessonType }[]) {
    publishedCountByType[lesson.type] = (publishedCountByType[lesson.type] || 0) + 1;
  }

  const byType: Partial<Record<LessonType, { count: number; percentages: number[] }>> = {};
  const activityDates: Date[] = [];
  for (const s of completed) {
    const stat = byType[s.lessonType] || { count: 0, percentages: [] };
    stat.count += 1;
    if (typeof s.totalScore === 'number' && s.maxScore) {
      stat.percentages.push((s.totalScore / s.maxScore) * 100);
    }
    byType[s.lessonType] = stat;

    const activityDate = toDate(s.submittedAt) || toDate(s.startedAt);
    if (activityDate) activityDates.push(activityDate);
  }

  const streak = computeStreak(activityDates);
  const peerReviewCount = rawPeerReviews.length;

  const qualifiesFor = (badge: Badge): boolean => {
    const { criteria } = badge;
    switch (criteria.type) {
      case 'count': {
        if (criteria.lessonType) {
          return (byType[criteria.lessonType]?.count || 0) >= criteria.threshold;
        }
        return completed.length >= criteria.threshold;
      }
      case 'perfect_score': {
        const percentages = criteria.lessonType
          ? byType[criteria.lessonType]?.percentages || []
          : Object.values(byType).flatMap(t => t?.percentages || []);
        return percentages.some(p => p >= 100);
      }
      case 'score_threshold': {
        if (!criteria.lessonType) return false;
        const stat = byType[criteria.lessonType];
        const totalOfType = publishedCountByType[criteria.lessonType] || 0;
        return (
          totalOfType > 0 &&
          !!stat &&
          stat.count >= totalOfType &&
          stat.percentages.length === stat.count &&
          stat.percentages.every(p => p >= criteria.threshold)
        );
      }
      case 'streak':
        return streak >= criteria.threshold;
      case 'peer_reviews':
        return peerReviewCount >= criteria.threshold;
      default:
        return false;
    }
  };

  const newlyEarned: NewlyEarnedBadge[] = [];
  for (const badge of BADGES) {
    if (knownBadgeIds.includes(badge.id)) continue;
    if (qualifiesFor(badge)) {
      newlyEarned.push({ id: badge.id, name: badge.name, tier: badge.tier });
    }
  }

  await Promise.all([
    ...newlyEarned.map(b => awardBadgeToUser(userId, b.id)),
    updateUserStreak(userId, streak),
  ]);

  return newlyEarned;
};
