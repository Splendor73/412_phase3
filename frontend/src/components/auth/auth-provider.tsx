"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

// Create context for Auth state
type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const authState = useRequireAuth();
  
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC to protect routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { redirectIfAuthenticated?: boolean; redirectTo?: string } = {}
) {
  return function ProtectedRoute(props: P) {
    const { isLoading, isAuthenticated } = useRequireAuth({
      redirectTo: options.redirectTo,
    });

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    // For auth pages like login/signup, redirect away if already authenticated
    if (options.redirectIfAuthenticated && isAuthenticated) {
      return null; // The useRequireAuth hook will handle redirection
    }

    // For protected pages, redirects are handled by useRequireAuth
    return <Component {...props} />;
  };
} 