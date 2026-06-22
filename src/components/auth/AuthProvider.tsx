// ============================================================
// LingoBite - Authentication Provider (Google Sign-In)
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logoutUser } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/types';
import { MOCK_TEACHER, MOCK_STUDENT } from '@/lib/mockData';

type AuthUser = UserProfile & { firebaseUser: { email: string | null; displayName: string | null; photoURL: string | null } };

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo: auto-login as student with mock data
    const mockUser = {
      ...MOCK_STUDENT,
      firebaseUser: {
        email: MOCK_STUDENT.email,
        displayName: MOCK_STUDENT.displayName,
        photoURL: MOCK_STUDENT.photoURL,
      },
    };
    setUser(mockUser as AuthUser);
    setLoading(false);
  }, []);

  const signIn = async () => {
    try {
      // In production: const result = await signInWithGoogle();
      // For demo: toggle between student and teacher
      const mockUser = {
        ...MOCK_STUDENT,
        firebaseUser: {
          email: MOCK_STUDENT.email,
          displayName: MOCK_STUDENT.displayName,
          photoURL: MOCK_STUDENT.photoURL,
        },
      };
      setUser(mockUser as AuthUser);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'teacher') {
      setUser({
        ...MOCK_TEACHER,
        firebaseUser: {
          email: MOCK_TEACHER.email,
          displayName: MOCK_TEACHER.displayName,
          photoURL: MOCK_TEACHER.photoURL,
        },
      } as AuthUser);
    } else {
      setUser({
        ...MOCK_STUDENT,
        firebaseUser: {
          email: MOCK_STUDENT.email,
          displayName: MOCK_STUDENT.displayName,
          photoURL: MOCK_STUDENT.photoURL,
        },
      } as AuthUser);
    }
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthProvider;
