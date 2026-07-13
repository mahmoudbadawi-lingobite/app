// ============================================================
// LingoBite - Complete Student Report (Teacher's view)
// A single-page rollup of one student's profile, achievements,
// progress, and peer-feedback activity.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Loader2, Mail, CalendarDays, Trophy, Flame,
  BarChart3, BookMarked, Mic, Target, MessageSquareHeart,
  Inbox, Send, CheckCircle, Clock, FileText, BookOpenCheck,
} from 'lucide-react';
import {
  getUserProfile, getStudentSubmissions, getPeerReviewsByReviewer,
  getPeerReviewsReceivedByStudent, toDate, fmtTimestamp,
} from '@/lib/firebase';
import { BADGES } from '@/lib/mockData';
import { avatarFallback } from '@/lib/utils';
import type { StudentSubmission, LessonType, UserProfile } from '@/types';

const TYPE_META: Record<LessonType, { label: string; icon: React.ElementType; color: string; light: string }> = {
  pronunciation: { label: 'Pronunciation', icon: Mic, color: '#c9993f', light: 'bg-[#c9993f]/10' },
  vocabulary: { label: 'Vocabulary', icon: BookMarked, color: '#38a169', light: 'bg-[#38a169]/10' },
  grammar: { label: 'Grammar', icon: Target, color: '#8b5cf6', light: 'bg-[#8b5cf6]/10' },
  reading: { label: 'Reading', icon: BookOpenCheck, color: '#2563eb', light: 'bg-[#2563eb]/10' },
};

interface Props {
  studentId: string;
  studentName: string | null;
  onBack: () => void;
}

const StudentReport: React.FC<Props> = ({ studentId, studentName, onBack }) => {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [reviewsGivenCount, setReviewsGivenCount] = useState(0);
  const [reviewsReceivedCount, setReviewsReceivedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, subs, given, received] = await Promise.all([
          getUserProfile(studentId),
          getStudentSubmissions(studentId),
          getPeerReviewsByReviewer(studentId),
          getPeerReviewsReceivedByStudent(studentId),
        ]);
        if (cancelled) return;
        setProfile(profileData as Partial<UserProfile> | null);
        setSubmissions(subs as StudentSubmission[]);
        setReviewsGivenCount(given.length);
        setReviewsReceivedCount(received.length);
      } catch (err) {
        console.error('Failed to load student report:', err);
        if (!cancelled) setError('Could not load this report right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const stats = useMemo(() => {
    const graded = submissions.filter(s => s.status === 'graded' && s.totalScore !== undefined);
    const completed = submissions.filter(s => s.status !== 'in_progress');
    const avgPercent = graded.length
      ? Math.round(graded.reduce((sum, s) => sum + (s.totalScore! / (s.maxScore || 1)) * 100, 0) / graded.length)
      : null;

    const byType: Record<LessonType, { completed: number; graded: number; avgPercent: number | null }> = {
      pronunciation: { completed: 0, graded: 0, avgPercent: null },
      vocabulary: { completed: 0, graded: 0, avgPercent: null },
      grammar: { completed: 0, graded: 0, avgPercent: null },
      reading: { completed: 0, graded: 0, avgPercent: null },
    };
    (['pronunciation', 'vocabulary', 'grammar', 'reading'] as LessonType[]).forEach(type => {
      const typeCompleted = completed.filter(s => s.lessonType === type);
      const typeGraded = graded.filter(s => s.lessonType === type);
      byType[type] = {
        completed: typeCompleted.length,
        graded: typeGraded.length,
        avgPercent: typeGraded.length
          ? Math.round(typeGraded.reduce((sum, s) => sum + (s.totalScore! / (s.maxScore || 1)) * 100, 0) / typeGraded.length)
          : null,
      };
    });

    const recent = submissions
      .slice()
      .sort((a, b) => toDate(b.submittedAt || b.startedAt).getTime() - toDate(a.submittedAt || a.startedAt).getTime())
      .slice(0, 8);

    return { avgPercent, completedCount: completed.length, gradedCount: graded.length, byType, recent };
  }, [submissions]);

  const earnedBadges = useMemo(
    () => BADGES.filter(b => (profile?.badges || []).includes(b.id)),
    [profile]
  );

  const displayName = studentName || profile?.displayName || 'Student';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#0d1b2a]/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Building report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <button
          onClick={onBack}
          className="lb-btn-outline flex items-center gap-2 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Students
        </button>

        {error && (
          <Card className="lb-card p-4 mb-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {/* Profile header */}
        <Card className="lb-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={profile?.customAvatarUrl || profile?.photoURL || avatarFallback(64)}
              alt={displayName}
              className="w-16 h-16 rounded-full border-2 border-[#c9993f]/30 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[#c9993f]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#c9993f]">Complete Student Report</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1b2a] truncate">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-[#0d1b2a]/50">
                {profile?.email && (
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
                )}
                {profile?.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Joined {toDate(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Lessons Completed', value: stats.completedCount, icon: BookMarked, color: 'text-[#c9993f]' },
            { label: 'Average Score', value: stats.avgPercent !== null ? `${stats.avgPercent}%` : '—', icon: BarChart3, color: 'text-[#38a169]' },
            { label: 'Current Streak', value: `${profile?.currentStreak ?? 0} days`, icon: Flame, color: 'text-orange-500' },
            { label: 'Badges Earned', value: `${earnedBadges.length} / ${BADGES.length}`, icon: Trophy, color: 'text-[#8b5cf6]' },
          ].map((stat, idx) => (
            <Card key={idx} className="lb-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#faf6ef] flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0d1b2a]">{stat.value}</p>
                  <p className="text-xs text-[#0d1b2a]/50">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Peer engagement */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="lb-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#faf6ef] flex items-center justify-center">
                <Inbox className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#0d1b2a]">{reviewsReceivedCount}</p>
                <p className="text-xs text-[#0d1b2a]/50">Peer Feedback Received</p>
              </div>
            </div>
          </Card>
          <Card className="lb-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#faf6ef] flex items-center justify-center">
                <Send className="w-5 h-5 text-[#38a169]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#0d1b2a]">{reviewsGivenCount}</p>
                <p className="text-xs text-[#0d1b2a]/50">Peer Feedback Given</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Breakdown by lesson type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(['pronunciation', 'vocabulary', 'grammar', 'reading'] as LessonType[]).map(type => {
            const meta = TYPE_META[type];
            const data = stats.byType[type];
            return (
              <Card key={type} className="lb-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${meta.light} flex items-center justify-center`}>
                    <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <span className="font-semibold text-[#0d1b2a] text-sm">{meta.label}</span>
                </div>
                <p className="text-2xl font-bold text-[#0d1b2a] mb-1">
                  {data.avgPercent !== null ? `${data.avgPercent}%` : '—'}
                </p>
                <p className="text-xs text-[#0d1b2a]/40">{data.completed} completed · {data.graded} graded</p>
              </Card>
            );
          })}
        </div>

        {/* Badges earned */}
        <Card className="lb-card p-5 mb-6">
          <h3 className="font-semibold text-[#0d1b2a] mb-4 text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#c9993f]" /> Badges Earned
          </h3>
          {earnedBadges.length === 0 ? (
            <p className="text-sm text-[#0d1b2a]/40">No badges earned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map(badge => (
                <Badge key={badge.id} className="bg-[#c9993f]/10 text-[#c9993f] border border-[#c9993f]/30 text-xs">
                  {badge.name}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Recent submissions */}
        <Card className="lb-card p-5 mb-6">
          <h3 className="font-semibold text-[#0d1b2a] mb-4 text-sm flex items-center gap-2">
            <MessageSquareHeart className="w-4 h-4 text-[#c9993f]" /> Recent Submissions
          </h3>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-[#0d1b2a]/40">No submissions yet.</p>
          ) : (
            <div className="divide-y divide-[#e5ddd0]">
              {stats.recent.map(sub => {
                const meta = TYPE_META[sub.lessonType];
                return (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${meta.light} flex items-center justify-center flex-shrink-0`}>
                        <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0d1b2a] truncate">{sub.lessonTitle}</p>
                        <p className="text-xs text-[#0d1b2a]/40">
                          {toDate(sub.submittedAt || sub.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className={sub.status === 'graded' ? 'lb-badge-reviewed' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {sub.status === 'graded'
                          ? <><CheckCircle className="w-3 h-3 mr-1" /> Graded</>
                          : <><Clock className="w-3 h-3 mr-1" /> {sub.status === 'submitted' ? 'Pending review' : 'In progress'}</>
                        }
                      </Badge>
                      {sub.status === 'graded' && sub.totalScore !== undefined && (
                        <p className="text-sm text-[#c9993f] font-bold mt-1">{sub.totalScore} / {sub.maxScore}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <p className="text-xs text-[#0d1b2a]/30 text-center">
          Report generated {fmtTimestamp(new Date())}
        </p>
      </div>
    </div>
  );
};

export default StudentReport;
