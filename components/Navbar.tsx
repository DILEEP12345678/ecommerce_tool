'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, LogIn, LogOut, Package, Shield, User } from 'lucide-react';
import { useUser, useSetUser, useUserRole } from './UserContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const setUser = useSetUser();
  const role = useUserRole();

  const handleLogout = () => {
    setUser(null);
    router.push('/login');
  };

  const customerLinks = [
    { href: '/store', label: 'Shop', icon: Home },
    { href: '/store/orders', label: 'My Orders', icon: ClipboardList },
  ];

  const managerLinks = [
    { href: '/collection-point', label: 'Dashboard', icon: Package },
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

  return (
    <>
      {/* ── TOP NAVBAR ─────────────────────────────────────── */}
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link href={homeLink} className="flex items-center gap-2 sm:gap-3 py-2">
              <Package className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">
                Collection Point
              </span>
              <span className="text-lg font-bold text-gray-900 xs:hidden">CPS</span>
            </Link>

            {/* Desktop Nav Links — hidden on mobile (bottom bar handles it) */}
            <div className="hidden sm:flex items-center gap-2">
              {user && links.map((link) => {
                const isActive =
                  link.href === '/store'
                    ? pathname === '/store'
                    : pathname.startsWith(link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                      isActive
                        ? 'text-primary-700 bg-primary-50 border-2 border-primary-200'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {user ? (
                <div className="ml-3 flex items-center gap-3 border-l-2 border-gray-200 pl-4">
                  <div className="text-right">
                    <p className="text-base font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{roleLabel}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border-2 border-transparent hover:border-red-100"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-3 flex items-center gap-2 px-4 py-3 text-base font-semibold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors border-l-2 border-gray-200 pl-4"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile right side — user chip + logout */}
            <div className="flex sm:hidden items-center gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    aria-label="Logout"
                    className="flex items-center justify-center w-10 h-10 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM TAB BAR — shown only when logged in ── */}
      {user && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-100 shadow-2xl bottom-nav">
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
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-primary-500'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-semibold">{link.label}</span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
