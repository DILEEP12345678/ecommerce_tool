'use client';

import { ArrowLeft, ClipboardList, LayoutDashboard, Leaf, Package, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/bulk-orders', label: 'Bulk Orders', icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Leaf className="w-7 h-7 text-primary-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                FreshCart Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-1">
                {links.map((link) => {
                  const isActive =
                    link.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(link.href);
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <Link
                href="/"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 border-l border-gray-200 pl-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Store
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
