// ============================================================
// LingoBite - Peer Review System (Firestore-powered)
// Anonymous timeline with emoji reactions
// ============================================================

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ThumbsUp, Star, Flame, Heart, Lightbulb,
  Send, MessageCircle, Clock, Loader2, Flag, CheckCircle2
} from 'lucide-react';
import type { PeerReview } from '@/types';
import {
  fmtTimestamp, getPeerReviewsForSubmission,
  addPeerReview, updatePeerReviewReactions, createNotification, notifyAllTeachers,
} from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import { avatarFallback } from '@/lib/utils';

interface Props {
  submissionId: string;
  // Needed so a comment can notify the classmate whose work is being reviewed.
  submissionOwnerId: string;
  lessonId?: string;
  lessonTitle: string;
}

const EMOJI_OPTIONS = [
  { emoji: '👍', icon: ThumbsUp, label: 'Good job' },
  { emoji: '🌟', icon: Star, label: 'Excellent' },
  { emoji: '👏', icon: ThumbsUp, label: 'Well done' },
  { emoji: '🔥', icon: Flame, label: 'Amazing' },
  { emoji: '❤️', icon: Heart, label: 'Love it' },
  { emoji: '💡', icon: Lightbulb, label: 'Insightful' },
];

const PeerReviewPanel: React.FC<Props> = ({ submissionId, submissionOwnerId, lessonId, lessonTitle }) => {
  const { user, refreshUser } = useAuth();
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeNotice, setBadgeNotice] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [reportingId, setReportingId] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      const data = await getPeerReviewsForSubmission(submissionId);
      setReviews(data as PeerReview[]);
    } catch (err) {
      console.error('Failed to load peer reviews:', err);
      setError('Could not load peer reviews right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  // Leaving reviews/reactions can unlock engagement badges (Peer Reviewer,
  // Community Champion). Fire this after any peer-review action; it's
  // silent unless something new was actually earned.
  const checkForNewBadges = async () => {
    if (!user) return;
    try {
      const { evaluateAndAwardBadges } = await import('@/lib/badgeEngine');
      const newlyEarned = await evaluateAndAwardBadges(user.uid, user.badges);
      if (newlyEarned.length > 0) {
        await refreshUser();
        setBadgeNotice(`🏆 New badge unlocked: ${newlyEarned.map(b => b.name).join(', ')}!`);
      }
    } catch (err) {
      console.error('Failed to evaluate badges:', err);
    }
  };

  const handleEmojiClick = async (review: PeerReview, emoji: string) => {
    if (!user) return;
    const reactions = review.emojiReactions.map(r => ({ ...r, userIds: [...r.userIds] }));
    const idx = reactions.findIndex(r => r.emoji === emoji);
    const hasReacted = idx >= 0 && reactions[idx].userIds.includes(user.uid);

    if (idx >= 0) {
      if (hasReacted) {
        reactions[idx].userIds = reactions[idx].userIds.filter(id => id !== user.uid);
        reactions[idx].count = Math.max(0, reactions[idx].count - 1);
      } else {
        reactions[idx].userIds.push(user.uid);
        reactions[idx].count += 1;
      }
    } else {
      reactions.push({ emoji, count: 1, userIds: [user.uid] });
    }

    // Optimistic UI update, then persist; roll back on failure.
    setReviews(prev => prev.map(r => (r.id === review.id ? { ...r, emojiReactions: reactions } : r)));
    try {
      await updatePeerReviewReactions(review.id, reactions);
      checkForNewBadges();
    } catch (err) {
      console.error('Failed to save reaction:', err);
      setReviews(prev => prev.map(r => (r.id === review.id ? review : r)));
    }
  };

  const handleReport = async (review: PeerReview) => {
    if (!user || reportedIds.has(review.id) || reportingId) return;
    setReportingId(review.id);
    try {
      await notifyAllTeachers({
        type: 'peer_review_reported',
        submissionId,
        lessonId,
        lessonTitle,
        fromUserId: user.uid,
        fromUserName: user.displayName || 'A student',
        fromUserPhotoURL: user.customAvatarUrl || user.photoURL || null,
        commentPreview: (review.writtenComment || '').slice(0, 140),
      });
      setReportedIds(prev => new Set(prev).add(review.id));
    } catch (err) {
      console.error('Failed to report peer review:', err);
      setError('Could not send the report. Please try again.');
    } finally {
      setReportingId(null);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !user || posting) return;
    setPosting(true);
    setError(null);
    const trimmedComment = comment.trim();
    const reviewerPhotoURL = user.customAvatarUrl || user.photoURL || null;
    try {
      await addPeerReview({
        submissionId,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'A classmate',
        reviewerPhotoURL,
        emojiReactions: [],
        writtenComment: trimmedComment,
      });
      setComment('');
      await loadReviews();
      checkForNewBadges();

      // Let the submission's owner know someone commented on their work.
      // Skip self-notifications if a student somehow reviews their own work.
      if (submissionOwnerId && submissionOwnerId !== user.uid) {
        try {
          await createNotification({
            recipientId: submissionOwnerId,
            type: 'peer_comment',
            submissionId,
            lessonId,
            lessonTitle,
            fromUserId: user.uid,
            fromUserName: user.displayName || 'A classmate',
            fromUserPhotoURL: reviewerPhotoURL,
            commentPreview: trimmedComment.slice(0, 140),
          });
        } catch (notifyErr) {
          // A failed notification shouldn't block the comment itself.
          console.error('Failed to notify submission owner:', notifyErr);
        }
      }

      // Let teachers see the content of every peer review as it's posted,
      // so they can keep an eye on peer feedback quality.
      try {
        await notifyAllTeachers({
          type: 'peer_review_posted',
          submissionId,
          lessonId,
          lessonTitle,
          fromUserId: user.uid,
          fromUserName: user.displayName || 'A student',
          fromUserPhotoURL: reviewerPhotoURL,
          commentPreview: trimmedComment.slice(0, 140),
        });
      } catch (notifyErr) {
        console.error('Failed to notify teachers of new peer review:', notifyErr);
      }
    } catch (err) {
      console.error('Failed to post peer review:', err);
      setError('Could not post your comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="lb-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-5 h-5 text-[#c9993f]" />
        <h3 className="font-serif text-xl font-bold text-[#0d1b2a]">Peer Reviews</h3>
        <Badge className="bg-[#c9993f]/10 text-[#c9993f] border-[#c9993f]/20">
          {reviews.length}
        </Badge>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {badgeNotice && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[#c9993f]/40 bg-[#c9993f]/10 px-3 py-2 text-sm text-[#0d1b2a]">
          <span>{badgeNotice}</span>
          <button
            onClick={() => setBadgeNotice(null)}
            className="text-[#0d1b2a]/60 hover:text-[#0d1b2a] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Comment Input */}
      <div className="mb-6 p-4 bg-[#faf6ef] rounded-xl">
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave an encouraging comment... (anonymous)"
          className="lb-input min-h-[80px] resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            onClick={handleCommentSubmit}
            disabled={!comment.trim() || posting}
            className="lb-btn-gold flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Comment
          </button>
        </div>
      </div>

      {/* Reviews Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-[#0d1b2a]/40">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading peer reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10">
          <MessageCircle className="w-10 h-10 text-[#0d1b2a]/15 mx-auto mb-2" />
          <p className="text-sm text-[#0d1b2a]/40">No peer reviews yet — be the first to leave one!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto lb-scroll pr-2">
          {reviews.map(review => (
            <div
              key={review.id}
              className="p-4 rounded-xl border border-[#e5ddd0] hover:border-[#c9993f]/30 transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={review.reviewerPhotoURL || avatarFallback(32)}
                    alt={review.reviewerName}
                    className="w-8 h-8 rounded-full border border-[#c9993f]/20 object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0d1b2a]">{review.reviewerName}</p>
                    <p className="text-xs text-[#0d1b2a]/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtTimestamp(review.createdAt)}
                    </p>
                  </div>
                </div>
                {user && review.reviewerId !== user.uid && (
                  reportedIds.has(review.id) ? (
                    <span className="flex items-center gap-1 text-xs text-[#0d1b2a]/40">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reported
                    </span>
                  ) : (
                    <button
                      onClick={() => handleReport(review)}
                      disabled={reportingId === review.id}
                      className="flex items-center gap-1 text-xs text-[#0d1b2a]/40 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Report this comment to your teacher"
                    >
                      {reportingId === review.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Flag className="w-3.5 h-3.5" />
                      }
                      Report
                    </button>
                  )
                )}
              </div>

              {review.writtenComment && (
                <p className="text-sm text-[#0d1b2a]/80 mb-3 leading-relaxed">
                  {review.writtenComment}
                </p>
              )}

              {/* Emoji Reactions */}
              <div className="flex flex-wrap items-center gap-2">
                {EMOJI_OPTIONS.map(({ emoji, label }) => {
                  const reaction = review.emojiReactions.find(r => r.emoji === emoji);
                  const count = reaction?.count || 0;
                  const hasReacted = !!user && (reaction?.userIds.includes(user.uid) ?? false);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(review, emoji)}
                      className={`lb-peer-emoji-btn ${hasReacted ? 'active' : ''} text-sm`}
                      title={label}
                    >
                      <span className="text-base">{emoji}</span>
                      {count > 0 && (
                        <span className="text-xs font-medium text-[#0d1b2a]/50 ml-0.5">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PeerReviewPanel;
