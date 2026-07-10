// ============================================================
// LingoBite - Student Progress Dashboard (Firestore-powered)
// Every number here is derived from the student's real
// student_submissions / peer_reviews records — no mock data.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, CheckCircle, Clock, Flame, Loader2, Mic,
  BookMarked, Target, MessageSquareHeart, TrendingUp, Award,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { getStudentSubmissions, getPeerReviewsByReviewer, toDate } from '@/lib/firebase';
import type { StudentSubmission, LessonType } from '@/types';

const TYPE_META: Record<LessonType, { label: string; icon: React.ElementType; color: string; light: string }> = {
  pronunciation: { label: 'Pronunciation', icon: Mic, color: '#c9993f', light: 'bg-[#c9993f]/10' },
  vocabulary: { label: 'Vocabulary', icon: BookMarked, color: '#38a169', light: 'bg-[#38a169]/10' },
  grammar: { label: 'Grammar', icon: Target, color: '#8b5cf6', light: 'bg-[#8b5cf6]/10' },
};

// Longest run of consecutive calendar days (ending today or yesterday)
// on which the student started or submitted at least one lesson.
const computeCurrentStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;
  const dayKeys = new Set(
    dates.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
  );
  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Streak must include today or yesterday to still be "current".
  let cursor = dayKeys.has(todayKey) ? todayKey : todayKey - oneDay;
  if (!dayKeys.has(cursor)) return 0;

  let streak = 0;
  while (dayKeys.has(cursor)) {
    streak += 1;
    cursor -= oneDay;
  }
  return streak;
};

const StudentProgress: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [peerReviewsGiven, setPeerReviewsGiven] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [subs, reviews] = await Promise.all([
          getStudentSubmissions(user.uid),
          getPeerReviewsByReviewer(user.uid),
        ]);
        if (cancelled) return;
        setSubmissions(subs as StudentSubmission[]);
        setPeerReviewsGiven(reviews.length);
      } catch (err) {
        console.error('Failed to load progress data:', err);
        if (!cancelled) setError('Could not load your progress right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const graded = submissions.filter(s => s.status === 'graded' && s.totalScore !== undefined);
    const completed = submissions.filter(s => s.status !== 'in_progress');

    const avgPercent = graded.length
      ? Math.round(
          graded.reduce((sum, s) => sum + (s.totalScore! / (s.maxScore || 1)) * 100, 0) / graded.length
        )
      : null;

    const activityDates = submissions
      .map(s => toDate(s.submittedAt || s.startedAt))
      .filter(Boolean);
    const streak = computeCurrentStreak(activityDates);

    const byType: Record<LessonType, { completed: number; graded: number; avgPercent: number | null }> = {
      pronunciation: { completed: 0, graded: 0, avgPercent: null },
      vocabulary: { completed: 0, graded: 0, avgPercent: null },
      grammar: { completed: 0, graded: 0, avgPercent: null },
    };
    (['pronunciation', 'vocabulary', 'grammar'] as LessonType[]).forEach(type => {
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

    const trend = graded
      .slice()
      .sort((a, b) => toDate(a.gradedAt || a.submittedAt).getTime() - toDate(b.gradedAt || b.submittedAt).getTime())
      .map(s => ({
        date: toDate(s.gradedAt || s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round((s.totalScore! / (s.maxScore || 1)) * 100),
        title: s.lessonTitle,
      }));

    const recent = submissions
      .slice()
      .sort((a, b) => toDate(b.submittedAt || b.startedAt).getTime() - toDate(a.submittedAt || a.startedAt).getTime())
      .slice(0, 6);

    return { avgPercent, completedCount: completed.length, gradedCount: graded.length, streak, byType, trend, recent };
  }, [submissions]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#0d1b2a]/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your progress...</span>
        </div>
      </div>
    );
  }

  const topStats = [
    { label: 'Lessons Completed', value: stats.completedCount, icon: BookMarked, color: 'text-[#c9993f]' },
    { label: 'Average Score', value: stats.avgPercent !== null ? `${stats.avgPercent}%` : '—', icon: BarChart3, color: 'text-[#38a169]' },
    { label: 'Current Streak', value: `${stats.streak} day${stats.streak === 1 ? '' : 's'}`, icon: Flame, color: 'text-orange-500' },
    { label: 'Peer Reviews Given', value: peerReviewsGiven, icon: MessageSquareHeart, color: 'text-[#8b5cf6]' },
  ];

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38a169] to-[#0d1b2a] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#0d1b2a]">My Progress</h1>
            <p className="text-sm text-[#0d1b2a]/50">Your real learning activity, tracked lesson by lesson</p>
          </div>
        </div>

        {error && (
          <Card className="lb-card p-4 mb-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {topStats.map((stat, idx) => (
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

        {submissions.length === 0 ? (
          <Card className="lb-card p-12 text-center">
            <BookMarked className="w-12 h-12 text-[#0d1b2a]/20 mx-auto mb-3" />
            <p className="text-[#0d1b2a]/50 font-medium mb-1">No lessons completed yet</p>
            <p className="text-sm text-[#0d1b2a]/30">Finish a lesson and your progress will show up here.</p>
          </Card>
        ) : (
          <>
            {/* Breakdown by lesson type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {(['pronunciation', 'vocabulary', 'grammar'] as LessonType[]).map(type => {
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
                    <p className="text-xs text-[#0d1b2a]/40">
                      {data.completed} completed · {data.graded} graded
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* Score trend */}
            {stats.trend.length >= 2 && (
              <Card className="lb-card p-5 mb-8">
                <h3 className="font-semibold text-[#0d1b2a] mb-4 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#38a169]" /> Score Trend
                </h3>
                <div className="h-56 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trend} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#0d1b2a99' }} axisLine={{ stroke: '#e5ddd0' }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#0d1b2a99' }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip
                        formatter={(value: number, _name, props) => [`${value}%`, props.payload.title]}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5ddd0', fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#c9993f" strokeWidth={2.5} dot={{ r: 3, fill: '#c9993f' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Recent activity */}
            <Card className="lb-card p-5">
              <h3 className="font-semibold text-[#0d1b2a] mb-4 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-[#c9993f]" /> Recent Activity
              </h3>
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
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
