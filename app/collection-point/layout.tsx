'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUserRole } from '@/components/UserContext';

export default function CollectionPointLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const role = useUserRole();

  // Redirect non-managers
  useEffect(() => {
    if (role && role !== 'collection_point_manager') {
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/store');
      }
    }
  }, [role, router]);

  // Don't render collection point pages for non-managers
  if (role && role !== 'collection_point_manager') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
