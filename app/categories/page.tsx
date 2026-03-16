'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

interface Category {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  featured?: boolean;
  order?: number;
}

const HOME_CATEGORIES: { slug: string; name: string; href: string }[] = [
  { slug: 'best-seller', name: 'Best Seller', href: '/best-seller' },
  { slug: 'niche-edition', name: 'Niche Edition', href: '/niche-edition' },
  { slug: 'inspired-perfumes', name: 'Inspired Perfumes', href: '/inspired-perfumes' },
  { slug: 'new-arrivals', name: 'New Arrivals', href: '/new-arrivals' },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching, setFetching] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      const existing: Category[] = Array.isArray(data) ? data : [];

      const mapped = HOME_CATEGORIES.map((item, index) => {
        const found = existing.find((cat) => cat.slug === item.slug);
        return {
          _id: found?._id,
          name: found?.name || item.name,
          slug: item.slug,
          image: found?.image || '',
          description: found?.description || '',
          featured: found?.featured ?? true,
          order: found?.order ?? index,
        };
      });

      setCategories(mapped);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(HOME_CATEGORIES.map((item, index) => ({
        name: item.name,
        slug: item.slug,
        image: '',
        description: '',
        featured: true,
        order: index,
      })));
    } finally {
      setFetching(false);
    }
  };

  const updateCategory = (slug: string, key: keyof Category, value: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.slug === slug ? { ...cat, [key]: value } : cat))
    );
  };

  const handleImageUpload = async (slug: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('folder', 'categories');
    setUploadingSlug(slug);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data.success) {
        updateCategory(slug, 'image', data.url);
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Image upload failed');
    } finally {
      setUploadingSlug(null);
      e.target.value = '';
    }
  };

  const saveCategory = async (category: Category) => {
    setSavingSlug(category.slug);
    const token = localStorage.getItem('adminToken');

    try {
      const payload = {
        name: category.name.trim(),
        slug: category.slug,
        image: category.image || '',
        description: category.description || '',
        featured: category.featured ?? true,
        order: category.order ?? 0,
      };

      const endpoint = category._id
        ? `${API_BASE_URL}/categories/${category._id}`
        : `${API_BASE_URL}/categories/slug/${category.slug}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert('Failed to save category');
        return;
      }

      const saved = await res.json();
      setCategories((prev) =>
        prev.map((cat) =>
          cat.slug === category.slug
            ? {
                ...cat,
                _id: saved._id,
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSavingSlug(null);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Homepage Categories</h1>
          <p className="text-gray-600 mt-1">
            Update the category name and image shown in the home page category section.
            Categories without products will not be shown on home page.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const routeInfo = HOME_CATEGORIES.find((item) => item.slug === category.slug);
            const isSaving = savingSlug === category.slug;
            const isUploading = uploadingSlug === category.slug;

            return (
              <div key={category.slug} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Route</p>
                  <p className="text-sm font-semibold text-gray-800">{routeInfo?.href}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category name</label>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategory(category.slug, 'name', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                    placeholder="Category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(category.slug, e)}
                    className="w-full px-4 py-2 border rounded-md"
                    disabled={isUploading}
                  />
                  {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                  {category.image && (
                    <img
                      src={getImageUrl(category.image)}
                      alt={`${category.name} preview`}
                      className="mt-4 w-32 h-32 object-cover rounded border"
                    />
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => saveCategory(category)}
                    disabled={isSaving || !category.name.trim()}
                    className="bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
