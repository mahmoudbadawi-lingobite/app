// ============================================================
// LingoBite - Peer Review System
// Anonymous timeline with emoji reactions
// ============================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ThumbsUp, Star, Flame, Heart, Lightbulb,
  Send, MessageCircle, User, Clock
} from 'lucide-react';
import { MOCK_PEER_REVIEWS } from '@/lib/mockData';
import type { PeerReview } from '@/types';
import { fmtTimestamp } from '@/lib/firebase';

interface Props {
  submissionId: string;
}

const EMOJI_OPTIONS = [
  { emoji: '👍', icon: ThumbsUp, label: 'Good job' },
  { emoji: '🌟', icon: Star, label: 'Excellent' },
  { emoji: '👏', icon: ThumbsUp, label: 'Well done' },
  { emoji: '🔥', icon: Flame, label: 'Amazing' },
  { emoji: '❤️', icon: Heart, label: 'Love it' },
  { emoji: '💡', icon: Lightbulb, label: 'Insightful' },
];

const PeerReviewPanel: React.FC<Props> = ({ submissionId }) => {
  const [reviews, setReviews] = useState<PeerReview[]>(MOCK_PEER_REVIEWS);
  const [comment, setComment] = useState('');
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  const handleEmojiClick = (reviewId: string, emoji: string) => {
    const current = userReactions[reviewId] || [];
    const hasReacted = current.includes(emoji);
    
    setUserReactions(prev => ({
      ...prev,
      [reviewId]: hasReacted
        ? current.filter(e => e !== emoji)
        : [...current, emoji],
    }));

    setReviews(prev =>
      prev.map(review => {
        if (review.id !== reviewId) return review;
        const reactions = [...review.emojiReactions];
        const existingIdx = reactions.findIndex(r => r.emoji === emoji);
        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          if (hasReacted) {
            reactions[existingIdx] = {
              ...existing,
              count: Math.max(0, existing.count - 1),
              userIds: existing.userIds.filter(() => true), // mock
            };
          } else {
            reactions[existingIdx] = {
              ...existing,
              count: existing.count + 1,
              userIds: [...existing.userIds, 'current_user'],
            };
          }
        } else if (!hasReacted) {
          reactions.push({ emoji, count: 1, userIds: ['current_user'] });
        }
        return { ...review, emojiReactions: reactions };
      })
    );
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    const newReview: PeerReview = {
      id: `pr_${Date.now()}`,
      submissionId,
      reviewerId: 'current_user',
      reviewerName: generateAnonymousName(),
      createdAt: new Date(),
      emojiReactions: [],
      writtenComment: comment.trim(),
    };
    setReviews(prev => [newReview, ...prev]);
    setComment('');
  };

  const generateAnonymousName = () => {
    const adjectives = ['Creative', 'Bright', 'Curious', 'Eager', 'Happy', 'Witty', 'Brave', 'Calm'];
    const animals = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Owl', 'Fox', 'Wolf', 'Bear'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}_${Math.floor(Math.random() * 99)}`;
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
            disabled={!comment.trim()}
            className="lb-btn-gold flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Post Comment
          </button>
        </div>
      </div>

      {/* Reviews Timeline */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto lb-scroll pr-2">
        {reviews.map(review => (
          <div
            key={review.id}
            className="p-4 rounded-xl border border-[#e5ddd0] hover:border-[#c9993f]/30 transition-all bg-white"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0d1b2a]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#0d1b2a]/50" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0d1b2a]">{review.reviewerName}</p>
                  <p className="text-xs text-[#0d1b2a]/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmtTimestamp(review.createdAt)}
                  </p>
                </div>
              </div>
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
                const hasReacted = (userReactions[review.id] || []).includes(emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(review.id, emoji)}
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
    </Card>
  );
};

export default PeerReviewPanel;
