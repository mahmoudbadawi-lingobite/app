// ============================================================
// LingoBite - Teacher Dashboard (Firestore-powered)
// Tabs: Submissions | Lessons
// ============================================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TeacherGradeCard from './TeacherGradeCard';
import LessonCreator from './LessonCreator';
import {
  Inbox, CheckCircle, Clock, Search,
  Users, GraduationCap, Loader2,
  Plus, BookOpen, Trash2, Edit, Mic, BookMarked, Target
} from 'lucide-react';
import type { StudentSubmission, Lesson } from '@/types';
import {
  getPendingSubmissions, updateSubmission, fmtTimestamp,
  getLessons, db
} from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { avatarFallback } from '@/lib/utils';
type Tab = 'submissions' | 'lessons';

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('submissions');

  // --- Submissions state ---
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  // --- Lessons state ---
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Load submissions
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPendingSubmissions();
        setSubmissions(data as StudentSubmission[]);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    fetch();
  }, []);

  // Load lessons
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLessons();
        setLessons(data as Lesson[]);
      } catch (err) {
        console.error('Failed to load lessons:', err);
      } finally {
        setLoadingLessons(false);
      }
    };
    fetch();
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return sub.status === 'submitted';
    if (filter === 'graded') return sub.status === 'graded';
    return true;
  }).filter(sub =>
    search === '' ||
    sub.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    sub.lessonTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  const handleGrade = async (submissionId: string, data: {
    totalScore: number;
    teacherWrittenFeedback: string;
    teacherAudioFeedbackUrl?: string;
    competenceFlags: string[];
    flawFlags: string[];
  }) => {
    try {
      await updateSubmission(submissionId, {
        ...data,
        status: 'graded',
        gradedAt: new Date(),
      });
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, ...data, status: 'graded' as const, gradedAt: new Date() }
            : sub
        )
      );
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Failed to save grade:', err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This cannot be undone.')) return;
    setDeletingId(lessonId);
    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error('Failed to delete lesson:', err);
      alert('Failed to delete lesson. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLessonSaved = async () => {
    setShowCreator(false);
    setLoadingLessons(true);
    try {
      const data = await getLessons();
      setLessons(data as Lesson[]);
    } catch (err) {
      console.error('Failed to reload lessons:', err);
    } finally {
      setLoadingLessons(false);
    }
  };

  const getLessonIcon = (type: string) => {
    if (type === 'pronunciation') return <Mic className="w-4 h-4 text-[#c9993f]" />;
    if (type === 'vocabulary') return <BookMarked className="w-4 h-4 text-[#38a169]" />;
    return <Target className="w-4 h-4 text-[#8b5cf6]" />;
  };

  const stats = [
    { label: 'Pending Review', value: pendingCount, icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Graded', value: gradedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Submissions', value: submissions.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Lessons', value: lessons.length, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Show creator full screen
  if (showCreator) {
    return (
      <LessonCreator
        onBack={() => { setShowCreator(false); setEditingLesson(null); }}
        onSaved={handleLessonSaved}
        editLesson={editingLesson || undefined}
      />
    );
  }

  // Show submission grading full screen
  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setSelectedSubmission(null)}
            className="lb-btn-outline flex items-center gap-2 mb-6"
          >
            ← Back to Dashboard
          </button>
          <TeacherGradeCard
            submission={selectedSubmission}
            onGrade={(data) => handleGrade(selectedSubmission.id, data)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0d1b2a] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#c9993f]" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0d1b2a]">Teacher Dashboard</h1>
              <p className="text-sm text-[#0d1b2a]/50">Manage lessons and review student submissions</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreator(true)}
            className="lb-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Lesson
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="lb-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0d1b2a]">{stat.value}</p>
                  <p className="text-xs text-[#0d1b2a]/50">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['submissions', 'lessons'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[#0d1b2a] text-[#faf6ef]'
                  : 'bg-white text-[#0d1b2a]/60 border border-[#e5ddd0] hover:border-[#c9993f]'
              }`}
            >
              {tab === 'submissions' ? `Submissions (${submissions.length})` : `Lessons (${lessons.length})`}
            </button>
          ))}
        </div>

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d1b2a]/30" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by student or lesson..."
                  className="lb-input pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'pending', 'graded'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filter === f
                        ? 'bg-[#0d1b2a] text-[#faf6ef]'
                        : 'bg-white text-[#0d1b2a]/60 border border-[#e5ddd0] hover:border-[#c9993f]'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loadingSubmissions ? (
              <div className="flex items-center justify-center py-20 gap-3 text-[#0d1b2a]/40">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading submissions...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSubmissions.map(sub => (
                  <Card
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className="lb-card p-5 cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={sub.studentPhotoURL || avatarFallback(40)}
                          alt={sub.studentName}
                          className="w-11 h-11 rounded-full border-2 border-[#c9993f]/20 object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-[#0d1b2a]">{sub.studentName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs capitalize">{sub.lessonType}</Badge>
                            <span className="text-xs text-[#0d1b2a]/40">{sub.lessonTitle}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={sub.status === 'graded' ? 'lb-badge-reviewed' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                          {sub.status === 'graded'
                            ? <><CheckCircle className="w-3 h-3 mr-1" /> Graded</>
                            : <><Clock className="w-3 h-3 mr-1" /> Pending</>
                          }
                        </Badge>
                        {sub.totalScore !== undefined && (
                          <p className="text-sm text-[#c9993f] font-bold mt-1">{sub.totalScore} / {sub.maxScore}</p>
                        )}
                        {sub.submittedAt && (
                          <p className="text-xs text-[#0d1b2a]/40 mt-0.5">{fmtTimestamp(sub.submittedAt)}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-12">
                    <Inbox className="w-12 h-12 text-[#0d1b2a]/20 mx-auto mb-3" />
                    <p className="text-[#0d1b2a]/40 font-medium">No submissions found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div>
            {loadingLessons ? (
              <div className="flex items-center justify-center py-20 gap-3 text-[#0d1b2a]/40">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading lessons...</span>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-[#0d1b2a]/20 mx-auto mb-3" />
                <p className="text-[#0d1b2a]/40 font-medium mb-4">No lessons yet</p>
                <button onClick={() => setShowCreator(true)} className="lb-btn-primary flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Create your first lesson
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map(lesson => (
                  <Card key={lesson.id} className="lb-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getLessonIcon(lesson.type)}
                        <Badge variant="outline" className="text-xs capitalize">{lesson.type}</Badge>
                      </div>
                      <Badge className={lesson.status === 'published'
                        ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                        : 'bg-amber-50 text-amber-700 border-amber-200 text-xs'
                      }>
                        {lesson.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-[#0d1b2a] mb-1 line-clamp-2">{lesson.title}</h3>
                    <p className="text-xs text-[#0d1b2a]/50 mb-4 line-clamp-2">{lesson.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-[#e5ddd0]">
                      <span className="text-xs text-[#0d1b2a]/40">
                        {(lesson.items as any[])?.length || 0} questions
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingLesson(lesson); setShowCreator(true); }}
                          className="p-1.5 rounded-lg hover:bg-[#faf6ef] text-[#0d1b2a]/40 hover:text-[#0d1b2a] transition-colors"
                          title="Edit lesson"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          disabled={deletingId === lesson.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#0d1b2a]/40 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Delete lesson"
                        >
                          {deletingId === lesson.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
