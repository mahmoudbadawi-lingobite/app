// ============================================================
// LingoBite - Student Peer Feedback (Teacher's read-only view)
// Shows the peer-review comments a specific student has given to
// classmates, and the ones they've received on their own work.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, ChevronLeft, Loader2, MessageCircle, Send, Inbox, Trash2,
} from 'lucide-react';
import { getPeerReviewsByReviewer, getPeerReviewsReceivedByStudent, deletePeerReview, fmtTimestamp } from '@/lib/firebase';
import { avatarFallback } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';

interface FeedbackItem {
  id: string;
  createdAt?: Timestamp | Date;
  writtenComment?: string;
  lessonTitle?: string;
  reviewerName?: string;
  reviewerPhotoURL?: string | null;
}

interface Props {
  studentId: string;
  studentName: string | null;
  onBack: () => void;
}

const StudentPeerFeedback: React.FC<Props> = ({ studentId, studentName, onBack }) => {
  const [given, setGiven] = useState<FeedbackItem[]>([]);
  const [received, setReceived] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'given' | 'received'>('received');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this peer review comment? This cannot be undone.')) return;
    setDeletingId(reviewId);
    try {
      await deletePeerReview(reviewId);
      setGiven(prev => prev.filter(item => item.id !== reviewId));
      setReceived(prev => prev.filter(item => item.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete peer review:', err);
      setError('Could not delete this comment right now. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [givenData, receivedData] = await Promise.all([
          getPeerReviewsByReviewer(studentId),
          getPeerReviewsReceivedByStudent(studentId),
        ]);
        if (cancelled) return;
        setGiven(givenData as FeedbackItem[]);
        setReceived(receivedData as FeedbackItem[]);
      } catch (err) {
        console.error('Failed to load peer feedback:', err);
        if (!cancelled) setError('Could not load peer feedback right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const list = tab === 'given' ? given : received;

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="lb-btn-outline flex items-center gap-2 mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Students
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#0d1b2a] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0d1b2a]">
                {studentName || 'Student'}'s Peer Feedback
              </h1>
              <p className="text-sm text-[#0d1b2a]/50">Comments given to classmates and received on their own work</p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="lb-card p-4 mb-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('received')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === 'received'
                ? 'bg-[#0d1b2a] text-[#faf6ef]'
                : 'bg-white text-[#0d1b2a]/60 border border-[#e5ddd0] hover:border-[#c9993f]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" /> Received ({received.length})
          </button>
          <button
            onClick={() => setTab('given')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === 'given'
                ? 'bg-[#0d1b2a] text-[#faf6ef]'
                : 'bg-white text-[#0d1b2a]/60 border border-[#e5ddd0] hover:border-[#c9993f]'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Given ({given.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[#0d1b2a]/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading peer feedback...</span>
          </div>
        ) : list.length === 0 ? (
          <Card className="lb-card p-12 text-center">
            <MessageCircle className="w-12 h-12 text-[#0d1b2a]/20 mx-auto mb-3" />
            <p className="text-[#0d1b2a]/50 font-medium mb-1">
              {tab === 'received' ? 'No feedback received yet' : 'No feedback given yet'}
            </p>
            <p className="text-sm text-[#0d1b2a]/30">
              {tab === 'received'
                ? "Comments classmates leave on this student's graded work will show up here."
                : "Comments this student leaves on classmates' work will show up here."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {list.map(item => (
              <Card key={item.id} className="lb-card p-5">
                <div className="flex items-start gap-3">
                  {tab === 'received' && (
                    <img
                      src={item.reviewerPhotoURL || avatarFallback(36)}
                      alt={item.reviewerName || 'Classmate'}
                      className="w-9 h-9 rounded-full border-2 border-[#c9993f]/20 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {tab === 'received' && (
                          <p className="text-sm font-semibold text-[#0d1b2a] truncate">
                            {item.reviewerName || 'A classmate'}
                          </p>
                        )}
                        {item.lessonTitle && (
                          <Badge variant="outline" className="text-xs">{item.lessonTitle}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#0d1b2a]/40">
                          {item.createdAt ? fmtTimestamp(item.createdAt) : ''}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-[#0d1b2a]/30 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete this comment"
                        >
                          {deletingId === item.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                    {item.writtenComment && (
                      <p className="text-sm text-[#0d1b2a]/70">"{item.writtenComment}"</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPeerFeedback;
