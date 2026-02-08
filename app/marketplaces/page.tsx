'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

interface Marketplace {
  _id: string;
  name: string;
  logo: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function MarketplacesPage() {
  const router = useRouter();
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchMarketplaces();
  }, []);

  const fetchMarketplaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/marketplaces?all=true`);
      const data = await response.json();
      setMarketplaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching marketplaces:', error);
      setMarketplaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this platform?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/marketplaces/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMarketplaces();
    } catch (error) {
      console.error('Error deleting marketplace:', error);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/marketplaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchMarketplaces();
    } catch (error) {
      console.error('Error updating marketplace:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplaces</h1>
            <p className="text-gray-600 mt-1">Platforms where your products are available (e.g. Amazon, Flipkart). Shown on the website &quot;We&apos;re also available at&quot; section.</p>
          </div>
          <Link
            href="/marketplaces/new"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            + Add Platform
          </Link>
        </div>

        {marketplaces.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No platforms yet</h3>
            <p className="text-gray-600 mb-6">Add marketplaces (Amazon, Flipkart, Myntra, Blinkit, etc.) and their product/store links. They will appear on the website.</p>
            <Link
              href="/marketplaces/new"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
            >
              + Add Platform
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {marketplaces.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {m.logo ? (
                        <img src={getImageUrl(m.logo)} alt={m.name} className="h-10 w-auto object-contain max-w-[100px]" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{m.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={m.url}>{m.url}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${m.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleToggleStatus(m._id, m.isActive)}
                        className={`mr-2 ${m.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link href={`/marketplaces/${m._id}`} className="text-primary-600 hover:text-primary-700 mr-2">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:text-red-700">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
