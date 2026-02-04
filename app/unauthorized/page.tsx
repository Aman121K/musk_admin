'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any stored data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-lg text-gray-600 mb-2">You are not authorized to access this admin panel.</p>
        <p className="text-sm text-gray-500 mb-6">
          Only users with admin role can access this panel.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-primary-600 text-white py-2 rounded-md font-semibold hover:bg-primary-700 transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
