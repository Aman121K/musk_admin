'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { API_BASE_URL, getImageUrl } from '@/lib/api';

type BannerForm = {
  title: string;
  image: string;
  link: string;
  position: string;
  isActive: boolean;
};

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<BannerForm>({
    title: '',
    image: '',
    link: '',
    position: 'home-top',
    isActive: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerId]);

  const fetchBanner = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners/${bannerId}`);
      if (!res.ok) throw new Error('Failed to load banner');
      const banner = await res.json();
      setFormData({
        title: banner.title || '',
        image: banner.image || '',
        link: banner.link || '',
        position: banner.position || 'home-top',
        isActive: Boolean(banner.isActive),
      });
    } catch (e) {
      console.error('Error fetching banner:', e);
      alert('Failed to load banner');
      router.push('/banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data?.success && data?.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/banners/${bannerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          image: formData.image,
          link: formData.link || undefined,
          position: formData.position,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        router.push('/banners');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'Failed to update banner');
      }
    } catch (err) {
      console.error('Error updating banner:', err);
      alert('Failed to update banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Banner</h1>
          <p className="text-gray-600 mt-1">Update banner details</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Banner Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Banner Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border rounded-md"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              {formData.image && (
                <img
                  src={getImageUrl(formData.image)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg mt-4"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Link URL</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Position *</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              >
                <option value="home-top">Home Top</option>
                <option value="home-middle">Home Middle</option>
                <option value="home-bottom">Home Bottom</option>
                <option value="category-top">Category Top</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

