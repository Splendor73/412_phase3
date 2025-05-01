"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

// Define your public and protected routes
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up'];
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/bookmarks'];

/**
 * Hook to handle authentication-based redirections
 * @param options Configuration options
 * @returns Authentication state
 */
export function useRequireAuth(options: { redirectTo?: string; } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (has a userId in localStorage)
    const userId = localStorage.getItem('userId');
    const isUserAuthenticated = !!userId;
    setIsAuthenticated(isUserAuthenticated);
    
    // Get current path
    const currentPath = pathname || '';
    
    // Handle redirections based on auth state and current path
    if (isUserAuthenticated) {
      // Authenticated users shouldn't access auth routes
      if (AUTH_ROUTES.some(route => currentPath.startsWith(route))) {
        toast("Already logged in", { description: "Redirecting to dashboard" });
        router.push('/dashboard');
      }
    } else {
      // Unauthenticated users can't access protected routes
      if (PROTECTED_ROUTES.some(route => currentPath.startsWith(route))) {
        // Remember where the user was trying to go
        if (currentPath !== '/auth/sign-in') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        
        toast.error("Authentication required", { 
          description: "Please sign in to access this page" 
        });
        router.push(options.redirectTo || '/auth/sign-in');
      }
    }
    
    setIsLoading(false);
  }, [pathname, router, options.redirectTo]);

  return { isLoading, isAuthenticated };
} 