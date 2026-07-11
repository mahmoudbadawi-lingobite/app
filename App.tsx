// ============================================================
// LingoBite - Main Application Router
// ============================================================

import React, { useEffect, useState } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AuthProvider, { useAuth } from '@/components/auth/AuthProvider';
import LessonCard from '@/components/lessons/LessonCard';
import PronunciationModule from '@/components/lessons/PronunciationModule';
import VocabularyModule from '@/components/lessons/VocabularyModule';
import GrammarModule from '@/components/lessons/GrammarModule';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import BadgeShowcase from '@/components/badges/BadgeShowcase';
import StudentProgress from '@/components/progress/StudentProgress';
import PeerFeedbackBrowser from '@/components/peer/PeerFeedbackBrowser';
import { createSubmission, getStudentSubmissions, getPeerReviewsByReviewer } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, Mic, BookMarked, Target, Trophy, GraduationCap,
  Sparkles, TrendingUp, Users, Zap, BarChart3
} from 'lucide-react';
import { ALL_LESSONS } from '@/lib/mockData';
import type { Lesson, StudentSubmission } from '@/types';
import './App.css';

type View = 'home' | 'lesson' | 'teacher' | 'badges' | 'progress' | 'peer';

const AppContent: React.FC = () => {
  const { user, isTeacher } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Real submissions for the signed-in student, replacing the old mock
  // data used to derive lesson progress badges and home stats.
  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);
  const [peerReviewsGiven, setPeerReviewsGiven] = useState(0);

  const isHome = currentView === 'home';
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) {
          setStudentSubmissions([]);
          setPeerReviewsGiven(0);
        }
        return;
      }
      try {
        const [subs, reviews] = await Promise.all([
          getStudentSubmissions(user.uid),
          getPeerReviewsByReviewer(user.uid),
        ]);
        if (cancelled) return;
        setStudentSubmissions(subs as StudentSubmission[]);
        setPeerReviewsGiven(reviews.length);
      } catch (err) {
        console.error('Failed to load student submissions:', err);
      }
    })();
    return () => { cancelled = true; };
    // Re-fetch whenever we land back on Home so a just-completed lesson
    // shows up immediately (e.g. after handleLessonComplete navigates back).
  }, [user, isHome]);

  const pronLessons = ALL_LESSONS.filter(l => l.type === 'pronunciation');
  const vocabLessons = ALL_LESSONS.filter(l => l.type === 'vocabulary');
  const grammarLessons = ALL_LESSONS.filter(l => l.type === 'grammar');

  const handleLessonClick = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setLessonProgress(0);
    setCurrentView('lesson');
  };

const handleLessonComplete = async (submission: Partial<StudentSubmission>) => {
  try {
    await createSubmission(submission);
  } catch (err) {
    console.error('Failed to save submission to Firestore:', err);
    window.alert('Something went wrong saving your submission. Please check your connection and try again.');
    return;
  }
  setCurrentView('home');
  setActiveLesson(null);
};

  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveLesson(null);
  };

  const renderLessonModule = () => {
    if (!activeLesson) return null;
    const existingSubmission = studentSubmissions.find(
      s => s.lessonId === activeLesson.id
    ) || null;

    switch (activeLesson.type) {
      case 'pronunciation':
        return (
          <PronunciationModule
            lesson={activeLesson}
            onComplete={handleLessonComplete}
            onBack={handleBackToHome}
            teacherView={isTeacher}
            existingSubmission={existingSubmission}
            onProgress={setLessonProgress}
          />
        );
      case 'vocabulary':
        return (
          <VocabularyModule
            lesson={activeLesson}
            onComplete={handleLessonComplete}
            onBack={handleBackToHome}
            teacherView={isTeacher}
            existingSubmission={existingSubmission}
            onProgress={setLessonProgress}
          />
        );
      case 'grammar':
        return (
          <GrammarModule
            lesson={activeLesson}
            onComplete={handleLessonComplete}
            onBack={handleBackToHome}
            teacherView={isTeacher}
            existingSubmission={existingSubmission}
            onProgress={setLessonProgress}
          />
        );
      default:
        return null;
    }
  };

  const getLessonProgress = (lessonId: string) => {
    const sub = studentSubmissions.find(s => s.lessonId === lessonId);
    if (sub?.status === 'graded') return 100;
    if (sub?.status === 'submitted') return 75;
    return 0;
  };

  // Lesson Browser View
  const renderHome = () => (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="relative rounded-[1.5rem] overflow-hidden mb-10 bg-gradient-to-br from-[#0d1b2a] to-[#1a2d42]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[#c9993f] blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-[#38a169] blur-3xl" />
          </div>
          <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#c9993f]" />
                <span className="text-[#c9993f] text-sm font-semibold uppercase tracking-wider">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'Learner'}!
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#faf6ef] mb-4 leading-tight">
                Master English<br />
                <span className="text-[#c9993f]">One Bite at a Time</span>
              </h1>
              <p className="text-[#faf6ef]/70 text-base sm:text-lg mb-6 max-w-lg">
                Interactive pronunciation, vocabulary, and grammar lessons with personalized teacher feedback.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentView('badges')}
                  className="lb-btn-gold flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" /> View Achievements
                </button>
                <button
                  onClick={() => setCurrentView('progress')}
                  className="lb-btn-outline text-[#faf6ef] border-[#faf6ef]/30 hover:bg-[#faf6ef]/10 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" /> My Progress
                </button>
                <button
                  onClick={() => setCurrentView('peer')}
                  className="lb-btn-outline text-[#faf6ef] border-[#faf6ef]/30 hover:bg-[#faf6ef]/10 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Peer Feedback
                </button>
                {isTeacher && (
                  <button
                    onClick={() => setCurrentView('teacher')}
                    className="lb-btn-outline text-[#faf6ef] border-[#faf6ef]/30 hover:bg-[#faf6ef]/10 flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" /> Teacher Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Lessons Available', value: ALL_LESSONS.length, icon: BookOpen, color: 'text-[#c9993f]' },
            { label: 'Completed', value: studentSubmissions.filter(s => s.status === 'graded').length, icon: TrendingUp, color: 'text-[#38a169]' },
            { label: 'Peer Reviews', value: peerReviewsGiven, icon: Users, color: 'text-[#8b5cf6]' },
            { label: 'Current Streak', value: `${user?.currentStreak || 0} days`, icon: Zap, color: 'text-orange-500' },
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

        {/* Lesson Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-[#e5ddd0] rounded-xl p-1 h-auto">
            <TabsTrigger
              value="all"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0d1b2a] data-[state=active]:text-[#faf6ef]"
            >
              All Lessons
            </TabsTrigger>
            <TabsTrigger
              value="pronunciation"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0d1b2a] data-[state=active]:text-[#faf6ef]"
            >
              <Mic className="w-3.5 h-3.5 mr-1.5" /> Pronunciation
            </TabsTrigger>
            <TabsTrigger
              value="vocabulary"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0d1b2a] data-[state=active]:text-[#faf6ef]"
            >
              <BookMarked className="w-3.5 h-3.5 mr-1.5" /> Vocabulary
            </TabsTrigger>
            <TabsTrigger
              value="grammar"
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0d1b2a] data-[state=active]:text-[#faf6ef]"
            >
              <Target className="w-3.5 h-3.5 mr-1.5" /> Grammar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ALL_LESSONS.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                  progress={getLessonProgress(lesson.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pronunciation" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pronLessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                  progress={getLessonProgress(lesson.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vocabulary" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vocabLessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                  progress={getLessonProgress(lesson.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="grammar" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {grammarLessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                  progress={getLessonProgress(lesson.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="lb-section-divider mb-8" />
          <p className="text-sm text-[#0d1b2a]/40 mb-2">
            LingoBite - Interactive English Learning Platform
          </p>
          <p className="text-xs text-[#0d1b2a]/30">
            Built with React, Firebase, Web Audio API, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader
        currentLesson={
          currentView === 'lesson' && activeLesson
            ? { title: activeLesson.title, progress: lessonProgress }
            : null
        }
        onBack={currentView !== 'home' ? handleBackToHome : undefined}
        onNavigateToPeerFeedback={() => setCurrentView('peer')}
      />

      {currentView === 'home' && renderHome()}
      {currentView === 'lesson' && renderLessonModule()}
      {currentView === 'teacher' && <TeacherDashboard />}
      {currentView === 'badges' && <BadgeShowcase />}
      {currentView === 'progress' && <StudentProgress />}
      {currentView === 'peer' && <PeerFeedbackBrowser />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
