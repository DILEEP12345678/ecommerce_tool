'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  role: 'customer' | 'collection_point_manager';
  collectionPoint?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Save user to localStorage when it changes
  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser }}>
      {children}
    </UserContext.Provider>
  );
}
