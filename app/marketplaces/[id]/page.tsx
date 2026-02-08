'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

export default function EditMarketplacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    url: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/marketplaces/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.push('/marketplaces');
          return;
        }
        const data = await res.json();
        setFormData({
          name: data.name || '',
          logo: data.logo || '',
          url: data.url || '',
          order: data.order ?? 0,
          isActive: data.isActive ?? true,
        });
      } catch {
        router.push('/marketplaces');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('folder', 'marketplaces');

    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.success) setFormData((prev) => ({ ...prev, logo: data.url }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/marketplaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) router.push('/marketplaces');
      else alert('Failed to update platform');
    } catch (err) {
      console.error('Error updating marketplace:', err);
      alert('Failed to update platform');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Platform</h1>
          <p className="text-gray-600 mt-1">Update logo and link for this marketplace.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Platform name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Logo *</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2 border rounded-md" disabled={uploading} />
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              {formData.logo && (
                <img src={getImageUrl(formData.logo)} alt="Logo preview" className="mt-4 h-14 w-auto object-contain max-w-[140px] border rounded p-1" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Link URL *</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Display order</label>
              <input
                type="number"
                min={0}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Show on website</label>
            </div>
            <div className="flex space-x-4">
              <button type="submit" disabled={loading} className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
              <Link href="/marketplaces" className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 inline-block">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
