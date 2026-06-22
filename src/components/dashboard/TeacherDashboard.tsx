// ============================================================
// LingoBite - Teacher Dashboard
// Full review interface for all pending submissions
// ============================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TeacherGradeCard from './TeacherGradeCard';
import {
  Inbox, CheckCircle, Clock, Search,
  Users, TrendingUp, GraduationCap
} from 'lucide-react';
import type { StudentSubmission } from '@/types';
import { MOCK_SUBMISSIONS } from '@/lib/mockData';
import { fmtTimestamp } from '@/lib/firebase';

const TeacherDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(MOCK_SUBMISSIONS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return sub.status === 'submitted';
    if (filter === 'graded') return sub.status === 'graded';
    return true;
  }).filter(sub =>
    search === '' ||
    sub.studentName.toLowerCase().includes(search.toLowerCase()) ||
    sub.lessonTitle.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  const handleGrade = (submissionId: string, data: {
    totalScore: number;
    teacherWrittenFeedback: string;
    teacherAudioFeedbackUrl?: string;
    competenceFlags: string[];
    flawFlags: string[];
  }) => {
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === submissionId
          ? { ...sub, ...data, status: 'graded' as const, gradedAt: new Date() }
          : sub
      )
    );
    setSelectedSubmission(null);
  };

  const stats = [
    { label: 'Pending Review', value: pendingCount, icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Graded', value: gradedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Students', value: 24, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg. Score', value: '78%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#0d1b2a] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#c9993f]" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0d1b2a]">Teacher Dashboard</h1>
              <p className="text-sm text-[#0d1b2a]/50">Review and grade student submissions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
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

        {selectedSubmission ? (
          /* Single Submission Review */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="lb-btn-outline flex items-center gap-2"
            >
              ← Back to List
            </button>
            <TeacherGradeCard
              submission={selectedSubmission}
              onGrade={(data) => handleGrade(selectedSubmission.id, data)}
            />
          </div>
        ) : (
          /* Submissions List */
          <div>
            {/* Filters */}
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

            {/* Submissions Grid */}
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
                        src={sub.studentPhotoURL || 'https://via.placeholder.com/40'}
                        alt={sub.studentName}
                        className="w-11 h-11 rounded-full border-2 border-[#c9993f]/20 object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-[#0d1b2a]">{sub.studentName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs capitalize">
                            {sub.lessonType}
                          </Badge>
                          <span className="text-xs text-[#0d1b2a]/40">{sub.lessonTitle}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          sub.status === 'graded'
                            ? 'lb-badge-reviewed'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }
                      >
                        {sub.status === 'graded' ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Graded</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                      {sub.totalScore !== undefined && (
                        <p className="text-sm text-[#c9993f] font-bold mt-1">
                          {sub.totalScore} / {sub.maxScore}
                        </p>
                      )}
                      {sub.submittedAt && (
                        <p className="text-xs text-[#0d1b2a]/40 mt-0.5">
                          {fmtTimestamp(sub.submittedAt)}
                        </p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
