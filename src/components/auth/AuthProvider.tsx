// ============================================================
// LingoBite - Authentication Provider (Real Firebase Google Sign-In)
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithGoogle,
  logoutUser,
  createUserProfile,
  getUserProfile,
  updateUserAvatar,
  onAuthChange,
} from '@/lib/firebase';
import AvatarPicker from '@/components/auth/AvatarPicker';
import type { UserProfile, UserRole } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';

type AuthUser = UserProfile & {
  firebaseUser: {
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  setAvatar: (avatarUrl: string) => Promise<void>;
  openAvatarPicker: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Build our AuthUser from Firebase user + Firestore profile
  const buildAuthUser = async (firebaseUser: FirebaseUser): Promise<AuthUser> => {
    let profile = await getUserProfile(firebaseUser.uid);
    if (!profile) {
      await createUserProfile(firebaseUser, 'student');
      profile = await getUserProfile(firebaseUser.uid);
    }
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      customAvatarUrl: profile?.customAvatarUrl ?? null,
      role: (profile?.role as UserRole) || 'student',
      createdAt: profile?.createdAt?.toDate?.() || new Date(),
      lastLoginAt: profile?.lastLoginAt?.toDate?.() || new Date(),
      badges: profile?.badges || [],
      totalScore: profile?.totalScore || 0,
      lessonsCompleted: profile?.lessonsCompleted || 0,
      currentStreak: profile?.currentStreak || 0,
      firebaseUser: {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      },
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const authUser = await buildAuthUser(firebaseUser);
          setUser(authUser);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithGoogle();
      const authUser = await buildAuthUser(result.user);
      setUser(authUser);
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
  };

  // Teachers can switch to student view and back (role stored in Firestore)
  const switchRole = async (role: UserRole) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  const setAvatar = async (avatarUrl: string) => {
    if (!user) return;
    await updateUserAvatar(user.uid, avatarUrl);
    setUser({ ...user, customAvatarUrl: avatarUrl });
    setAvatarPickerOpen(false);
  };

  const openAvatarPicker = () => setAvatarPickerOpen(true);

  // First-time users (no avatar chosen yet) are prompted automatically and
  // can't dismiss the picker without choosing one. Existing users can reopen
  // it anytime via openAvatarPicker() (e.g. clicking their avatar).
  const needsInitialAvatar = !!user && !user.customAvatarUrl;
  const showAvatarPicker = needsInitialAvatar || avatarPickerOpen;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
        switchRole,
        setAvatar,
        openAvatarPicker,
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-[#faf6ef] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#c9993f] text-xl font-bold">L</span>
            </div>
            <p className="text-[#0d1b2a]/50 text-sm">Loading LingoBite...</p>
          </div>
        </div>
      ) : !user ? (
        <div className="min-h-screen bg-[#faf6ef] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#0d1b2a] flex items-center justify-center mx-auto mb-6">
              <span className="text-[#c9993f] text-3xl font-bold">L</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#0d1b2a] mb-2">
              Lingo<span className="text-[#c9993f]">Bite</span>
            </h1>
            <p className="text-[#0d1b2a]/50 mb-8 text-sm">
              Interactive English Learning Platform
            </p>
            <button
              onClick={signIn}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#e5ddd0] rounded-xl px-6 py-3 text-[#0d1b2a] font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      ) : (
        <>
          {children}
          {showAvatarPicker && (
            <AvatarPicker
              open={showAvatarPicker}
              dismissable={!needsInitialAvatar}
              currentAvatarUrl={user?.customAvatarUrl}
              onOpenChange={(open) => { if (!needsInitialAvatar) setAvatarPickerOpen(open); }}
              onSelect={setAvatar}
            />
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthProvider;
