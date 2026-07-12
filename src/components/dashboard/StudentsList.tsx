// ============================================================
// LingoBite - Students List (Teacher's roster)
// Search students and jump into a specific student's achievements,
// progress, peer feedback, or a full aggregated report.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search, Loader2, GraduationCap, Trophy, BarChart3, Users, FileText,
} from 'lucide-react';
import { getAllStudents } from '@/lib/firebase';
import { avatarFallback } from '@/lib/utils';
import BadgeShowcase from '@/components/badges/BadgeShowcase';
import StudentProgress from '@/components/progress/StudentProgress';
import StudentPeerFeedback from '@/components/dashboard/StudentPeerFeedback';
import StudentReport from '@/components/dashboard/StudentReport';

interface StudentRow {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  customAvatarUrl?: string | null;
  badges: string[];
  currentStreak: number;
  totalScore: number;
  lessonsCompleted: number;
}

type DetailView = 'achievements' | 'progress' | 'peer' | 'report' | null;

const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [detailView, setDetailView] = useState<DetailView>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllStudents();
        if (cancelled) return;
        setStudents(data as unknown as StudentRow[]);
      } catch (err) {
        console.error('Failed to load students:', err);
        if (!cancelled) setError('Could not load the student roster right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = students.filter(s =>
    search === '' ||
    s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = (student: StudentRow, view: DetailView) => {
    setSelected(student);
    setDetailView(view);
  };

  const closeDetail = () => {
    setSelected(null);
    setDetailView(null);
  };

  // --- Detail views ---
  if (selected && detailView === 'achievements') {
    return (
      <BadgeShowcase
        student={{
          uid: selected.uid,
          displayName: selected.displayName,
          badges: selected.badges,
          currentStreak: selected.currentStreak,
        }}
        onBack={closeDetail}
      />
    );
  }

  if (selected && detailView === 'progress') {
    return (
      <StudentProgress
        studentId={selected.uid}
        studentName={selected.displayName}
        onBack={closeDetail}
      />
    );
  }

  if (selected && detailView === 'peer') {
    return (
      <StudentPeerFeedback
        studentId={selected.uid}
        studentName={selected.displayName}
        onBack={closeDetail}
      />
    );
  }

  if (selected && detailView === 'report') {
    return (
      <StudentReport
        studentId={selected.uid}
        studentName={selected.displayName}
        onBack={closeDetail}
      />
    );
  }

  // --- List view ---
  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d1b2a]/30" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="lb-input pl-10"
        />
      </div>

      {error && (
        <Card className="lb-card p-4 mb-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#0d1b2a]/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading students...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap className="w-12 h-12 text-[#0d1b2a]/20 mx-auto mb-3" />
          <p className="text-[#0d1b2a]/40 font-medium">
            {students.length === 0 ? 'No students yet' : 'No students match your search'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(student => (
            <Card key={student.uid} className="lb-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={student.customAvatarUrl || student.photoURL || avatarFallback(44)}
                    alt={student.displayName || 'Student'}
                    className="w-11 h-11 rounded-full border-2 border-[#c9993f]/20 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0d1b2a] truncate">{student.displayName || 'Unnamed Student'}</p>
                    <p className="text-xs text-[#0d1b2a]/40 truncate">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-14 sm:pl-0 text-xs text-[#0d1b2a]/50 flex-shrink-0">
                  <span>{student.lessonsCompleted || 0} lessons</span>
                  <span>{student.currentStreak || 0}d streak</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pl-14 sm:pl-0 flex-shrink-0">
                  <button
                    onClick={() => openDetail(student, 'achievements')}
                    className="lb-btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5"
                    title="View achievements"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Achievements
                  </button>
                  <button
                    onClick={() => openDetail(student, 'progress')}
                    className="lb-btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5"
                    title="View progress"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Progress
                  </button>
                  <button
                    onClick={() => openDetail(student, 'peer')}
                    className="lb-btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5"
                    title="View peer feedback"
                  >
                    <Users className="w-3.5 h-3.5" /> Peer Feedback
                  </button>
                  <button
                    onClick={() => openDetail(student, 'report')}
                    className="lb-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                    title="View complete report"
                  >
                    <FileText className="w-3.5 h-3.5" /> Full Report
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentsList;
