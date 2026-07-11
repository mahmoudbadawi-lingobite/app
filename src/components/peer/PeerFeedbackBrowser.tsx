// ============================================================
// LingoBite - Peer Feedback Browser
// Lets a student find classmates' submitted/graded lessons and
// leave a real peer review on someone else's work.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, Mic, BookMarked, Target, Loader2, CheckCircle,
  Clock, MessageCircle, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSubmissionsForPeerFeedback, fmtTimestamp } from '@/lib/firebase';
import { avatarFallback } from '@/lib/utils';
import PeerReviewPanel from '@/components/peer/PeerReviewPanel';
import SubmissionContentViewer from '@/components/peer/SubmissionContentViewer';
import type { StudentSubmission, LessonType } from '@/types';

const TYPE_META: Record<LessonType, { label: string; icon: React.ElementType; badgeBg: string }> = {
  pronunciation: { label: 'Pronunciation', icon: Mic, badgeBg: 'bg-[#c9993f]/10 text-[#c9993f]' },
  vocabulary: { label: 'Vocabulary', icon: BookMarked, badgeBg: 'bg-[#38a169]/10 text-[#38a169]' },
  grammar: { label: 'Grammar', icon: Target, badgeBg: 'bg-[#8b5cf6]/10 text-[#8b5cf6]' },
};

const PeerFeedbackBrowser: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | LessonType>('all');
  const [selected, setSelected] = useState<StudentSubmission | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSubmissionsForPeerFeedback();
        if (cancelled) return;
        setSubmissions(data as StudentSubmission[]);
      } catch (err) {
        console.error('Failed to load classmates\' submissions:', err);
        if (!cancelled) setError('Could not load classmates\' work right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const classmateSubmissions = useMemo(
    () => submissions.filter(s => s.studentId !== user?.uid),
    [submissions, user]
  );

  const filtered = useMemo(
    () => filterType === 'all'
      ? classmateSubmissions
      : classmateSubmissions.filter(s => s.lessonType === filterType),
    [classmateSubmissions, filterType]
  );

  if (!user) return null;

  // Detail view: leaving feedback on a specific classmate's submission.
  if (selected) {
    const meta = TYPE_META[selected.lessonType];
    return (
      <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setSelected(null)}
            className="lb-btn-outline flex items-center gap-2 mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Peer Feedback
          </button>

          <Card className="lb-card p-5 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={selected.studentPhotoURL || avatarFallback(44)}
                alt={selected.studentName}
                className="w-11 h-11 rounded-full border-2 border-[#c9993f]/20 object-cover"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-[#0d1b2a]">{selected.studentName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`${meta.badgeBg} border-0 text-xs`}>
                    <meta.icon className="w-3 h-3 mr-1" /> {meta.label}
                  </Badge>
                  <span className="text-xs text-[#0d1b2a]/40">{selected.lessonTitle}</span>
                </div>
              </div>
              {selected.status === 'graded' && selected.totalScore !== undefined && (
                <p className="text-sm text-[#c9993f] font-bold">{selected.totalScore} / {selected.maxScore}</p>
              )}
            </div>
          </Card>

          <SubmissionContentViewer submission={selected} />

          <PeerReviewPanel
            submissionId={selected.id}
            submissionOwnerId={selected.studentId}
            lessonTitle={selected.lessonTitle}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#0d1b2a] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#0d1b2a]">Peer Feedback</h1>
            <p className="text-sm text-[#0d1b2a]/50">Encourage classmates by reviewing their work</p>
          </div>
        </div>

        {error && (
          <Card className="lb-card p-4 mb-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {/* Type Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'pronunciation', 'vocabulary', 'grammar'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap ${
                filterType === type
                  ? 'bg-[#0d1b2a] text-[#faf6ef]'
                  : 'bg-white text-[#0d1b2a]/60 border border-[#e5ddd0] hover:border-[#c9993f]'
              }`}
            >
              {type === 'all' ? 'All Lessons' : TYPE_META[type].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[#0d1b2a]/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading classmates' work...</span>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="lb-card p-12 text-center">
            <Users className="w-12 h-12 text-[#0d1b2a]/20 mx-auto mb-3" />
            <p className="text-[#0d1b2a]/50 font-medium mb-1">Nothing to review yet</p>
            <p className="text-sm text-[#0d1b2a]/30">
              Once a teacher reviews a classmate's submission, it'll show up here for feedback.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(sub => {
              const meta = TYPE_META[sub.lessonType];
              return (
                <Card
                  key={sub.id}
                  onClick={() => setSelected(sub)}
                  className="lb-card p-5 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={sub.studentPhotoURL || avatarFallback(40)}
                      alt={sub.studentName}
                      className="w-10 h-10 rounded-full border-2 border-[#c9993f]/20 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0d1b2a] text-sm truncate">{sub.studentName}</p>
                      <p className="text-xs text-[#0d1b2a]/40">
                        {sub.submittedAt ? fmtTimestamp(sub.submittedAt) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${meta.badgeBg} border-0 text-xs`}>
                      <meta.icon className="w-3 h-3 mr-1" /> {meta.label}
                    </Badge>
                    <Badge className={sub.status === 'graded' ? 'lb-badge-reviewed text-xs' : 'bg-blue-50 text-blue-700 border-blue-200 text-xs'}>
                      {sub.status === 'graded'
                        ? <><CheckCircle className="w-3 h-3 mr-1" /> Graded</>
                        : <><Clock className="w-3 h-3 mr-1" /> Pending</>
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-[#0d1b2a]/70 font-medium line-clamp-1 mb-3">{sub.lessonTitle}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#e5ddd0]">
                    <span className="text-xs text-[#0d1b2a]/40 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> Leave feedback
                    </span>
                    {sub.status === 'graded' && sub.totalScore !== undefined && (
                      <span className="text-xs text-[#c9993f] font-bold">{sub.totalScore} / {sub.maxScore}</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerFeedbackBrowser;
