'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'customer' | 'collection_point_manager' | 'admin';
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
  // Read localStorage synchronously so the user is available on the very first render.
  // This prevents page guards (useEffect checking !user) from firing before the
  // saved session is loaded, which caused an immediate redirect back to /login.
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

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
