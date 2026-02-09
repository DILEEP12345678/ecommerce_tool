'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

const UserContext = createContext<Id<"users"> | null>(null);

export function useUserId() {
  const userId = useContext(UserContext);
  return userId;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const getOrCreateGuest = useMutation(api.users.getOrCreateGuest);

  useEffect(() => {
    getOrCreateGuest().then(setUserId);
  }, [getOrCreateGuest]);

  return (
    <UserContext.Provider value={userId}>
      {children}
    </UserContext.Provider>
  );
}
