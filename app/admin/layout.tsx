'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUserRole } from '@/components/UserContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();

  // Redirect non-admins
  useEffect(() => {
    if (role && role !== 'admin') {
      if (role === 'collection_point_manager') {
        router.push('/collection-point');
      } else {
        router.push('/store');
      }
    }
  }, [role, router]);

  // Don't render admin pages for non-admins
  if (role && role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
