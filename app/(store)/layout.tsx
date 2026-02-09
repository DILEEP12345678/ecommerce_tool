'use client';

import Navbar from '@/components/Navbar';
import { UserProvider } from '@/components/UserContext';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
      </div>
    </UserProvider>
  );
}
