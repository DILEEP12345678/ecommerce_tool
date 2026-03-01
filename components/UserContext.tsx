'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'customer' | 'collection_point_manager' | 'admin';
  collectionPoint?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loaded: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loaded: false,
});

export function useUser() {
  return useContext(UserContext).user;
}

export function useUserId() {
  const user = useContext(UserContext).user;
  return user?.email || null;
}

export function useUsername() {
  const user = useContext(UserContext).user;
  return user?.name || null;
}

export function useUserRole() {
  const user = useContext(UserContext).user;
  return user?.role || null;
}

export function useCollectionPoint() {
  const user = useContext(UserContext).user;
  return user?.collectionPoint || null;
}

export function useSetUser() {
  return useContext(UserContext).setUser;
}

export function useUserLoaded() {
  return useContext(UserContext).loaded;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage only on the client, after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) setUser(JSON.parse(saved) as User);
    } catch {}
    setLoaded(true);
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, loaded }}>
      {children}
    </UserContext.Provider>
  );
}
