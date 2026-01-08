/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useMemo, useState } from 'react';
import {
  signIn,
  signUp,
  signOut,
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth';
import type { User } from '@/types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getUserIdFromSessionOrAttributes(
  attributes?: Partial<Record<string, string>> | Record<string, string>
) {

  const subFromAttr = attributes?.sub;
if (typeof subFromAttr === 'string' && subFromAttr.length > 0) return subFromAttr;

  const session = await fetchAuthSession();
  const sub = session.tokens?.idToken?.payload?.sub as string | undefined;
  return sub ?? '';
}

async function getRoleFromSession(): Promise<'admin' | 'user'> {
  const session = await fetchAuthSession();
  const groups = session.tokens?.idToken?.payload?.['cognito:groups'] as string[] | undefined;
  return groups?.includes('admin') ? 'admin' : 'user';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateUser = async () => {
    const attributes = await fetchUserAttributes();
    const id = await getUserIdFromSessionOrAttributes(attributes);
    const role = await getRoleFromSession();

    setUser({
      id,
      email: attributes.email ?? '',
      name: attributes.name ?? '',
      role,
      createdAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        await hydrateUser();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signIn({ username: email, password });
      await hydrateUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const signup = async (email: string, password: string, name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    const givenName = parts[0] ?? name;
    const familyName = parts.length > 1 ? parts.slice(1).join(' ') : givenName;

    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
          given_name: givenName,
          family_name: familyName,
        },
      },
    });
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user?.id,
      isLoading,
      login,
      logout,
      signup,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
