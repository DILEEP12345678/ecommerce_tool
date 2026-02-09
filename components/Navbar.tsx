'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ShoppingCart, Home, Grid3X3, ClipboardList, Leaf } from 'lucide-react';
import { useUserId } from './UserContext';

export default function Navbar() {
  const pathname = usePathname();
  const userId = useUserId();
  const cart = useQuery(api.cart.getUserCart, userId ? { userId } : 'skip');
  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/categories', label: 'Categories', icon: Grid3X3 },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/orders', label: 'Orders', icon: ClipboardList },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-7 h-7 text-primary-500" />
            <span className="text-xl font-bold text-gray-900">FreshCart</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                  {link.href === '/cart' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Admin Link */}
            <Link
              href="/admin"
              className="ml-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-primary-600 border-l border-gray-200"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
