'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Products', href: '/products', icon: '🛍️' },
  { name: 'Orders', href: '/orders', icon: '📦' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Testimonials', href: '/testimonials', icon: '💬' },
  { name: 'Banners', href: '/banners', icon: '🖼️' },
  { name: 'Marketplaces', href: '/marketplaces', icon: '🏪' },
  { name: 'Discounts', href: '/discounts', icon: '🎫' },
  { name: 'Blogs', href: '/blogs', icon: '📝' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary-600 text-white p-2 rounded-md shadow-lg"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <Link href="/dashboard" className="block">
              <Image
                src="/logo/musshk-logo-white.svg"
                alt="Musshk Admin"
                width={180}
                height={72}
                className="h-12 w-auto"
                priority
              />
              <p className="text-xs text-gray-400 mt-2">Admin Panel</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 px-4 py-3 text-gray-300">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">A</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-400">admin@musshk.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

