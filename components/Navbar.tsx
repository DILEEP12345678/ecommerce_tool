'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, LogIn, LogOut, Package, Shield, ShoppingCart, X } from 'lucide-react';
import { useUser, useSetUser, useUserRole } from './UserContext';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const setUser = useSetUser();
  const role = useUserRole();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    setUser(null);
    router.push('/login');
  };

  const customerLinks = [
    { href: '/store', label: 'Shop', icon: Home },
    { href: '/store/orders', label: 'My Orders', icon: ClipboardList },
  ];

  const managerLinks = [
    { href: '/collection-point', label: 'Dashboard', icon: Package },
    { href: '/collection-point/pack-list', label: 'Pack List', icon: ShoppingCart },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: Shield },
  ];

  const links =
    role === 'admin' ? adminLinks :
    role === 'collection_point_manager' ? managerLinks :
    customerLinks;

  const homeLink =
    role === 'admin' ? '/admin' :
    role === 'collection_point_manager' ? '/collection-point' :
    '/store';

  const roleLabel =
    role === 'admin' ? 'Admin' :
    role === 'collection_point_manager' ? 'Manager' :
    'Customer';

  const initials = user?.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '';

  return (
    <>
      {/* ── MINIMAL TOP BAR ────────────────────────────────── */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link href={homeLink} className="flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-500" />
              <span className="text-base font-bold text-gray-900">Collection Point</span>
            </Link>

            {/* Menu trigger */}
            {user ? (
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors"
                aria-label="Open menu"
              >
                {initials}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── DRAWER BACKDROP ────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── SLIDE-OUT DRAWER ───────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {links.map((link) => {
            const isActive =
              link.href === '/store'
                ? pathname === '/store'
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 border-t border-gray-100 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ──────────────────────────── */}
      {user && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg bottom-nav">
          <div className="flex">
            {links.map((link) => {
              const isActive =
                link.href === '/store'
                  ? pathname === '/store'
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-400 hover:text-primary-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
