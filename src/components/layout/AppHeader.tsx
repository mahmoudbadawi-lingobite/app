// ============================================================
// LingoBite - Sticky Header with Progress Bar & User Profile
// ============================================================

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Shield, GraduationCap, ChevronLeft } from 'lucide-react';
import { avatarFallback } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import logoImg from '@/assets/logo.png';

interface AppHeaderProps {
  currentLesson?: { title: string; progress: number } | null;
  onBack?: () => void;
  onNavigateToPeerFeedback?: () => void;
  onNavigateToProgress?: () => void;
  onNavigateToTeacher?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ currentLesson, onBack, onNavigateToPeerFeedback, onNavigateToProgress, onNavigateToTeacher }) => {
  const { user, isTeacher, switchRole, openAvatarPicker } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#faf6ef]/90 border-b border-[#c9993f]/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Back */}
          <div className="flex items-center gap-3 min-w-0">
            {onBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-[#0d1b2a] hover:bg-[#c9993f]/10 -ml-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            ) : null}
            <div className="flex items-center gap-2.5">
              <img
                src={logoImg}
                alt="LingoBite logo"
                className="h-12 w-12 object-contain shrink-0"
              />
              <span className="font-serif text-xl font-bold text-[#0d1b2a] hidden sm:block">
                Lingo<span className="text-[#c9993f]">Bite</span>
              </span>
            </div>
          </div>

          {/* Center: Progress Tracker */}
          {currentLesson ? (
            <div className="flex-1 max-w-md mx-4 sm:mx-8">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[#0d1b2a]/70 truncate">
                  {currentLesson.title}
                </p>
                <span className="text-xs font-bold text-[#c9993f] ml-2">
                  {currentLesson.progress}%
                </span>
              </div>
              <div className="lb-progress-bar">
                <div
                  className="lb-progress-fill"
                  style={{ width: `${currentLesson.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex justify-center">
              <span className="text-xs font-medium text-[#0d1b2a]/40 uppercase tracking-widest hidden sm:block">
                Interactive English Learning
              </span>
            </div>
          )}

          {/* Right: User Profile & Role Switch */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <>
                {user.role === 'teacher' && (
                  <button
                    onClick={() => switchRole(isTeacher ? 'student' : 'teacher')}
                    className="lb-btn-outline py-1.5 px-3 text-xs hidden sm:flex items-center gap-1.5"
                    title={`Switch to ${isTeacher ? 'Student' : 'Teacher'} view`}
                  >
                    {isTeacher ? <GraduationCap className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    {isTeacher ? 'Student View' : 'Teacher View'}
                  </button>
                )}

                <NotificationBell onNavigateToPeerFeedback={onNavigateToPeerFeedback} onNavigateToProgress={onNavigateToProgress} onNavigateToTeacher={onNavigateToTeacher} />

                <div className="flex items-center gap-2.5 pl-2 border-l border-[#c9993f]/20">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-[#0d1b2a] leading-tight">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-[#0d1b2a]/50 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAvatarPicker}
                    title="Change your avatar"
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#c9993f]/50"
                  >
                    <img
                      src={user.customAvatarUrl || user.photoURL || avatarFallback(40)}
                      alt={user.displayName || 'User'}
                      className="w-9 h-9 rounded-full border-2 border-[#c9993f]/30 object-cover hover:opacity-80 transition-opacity"
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
