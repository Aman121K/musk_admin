'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

interface ProductOption {
  _id: string;
  name: string;
}

interface CategoryApiProduct {
  _id?: string;
}

interface CategoryApi {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  featured?: boolean;
  order?: number;
  productIds?: Array<string | CategoryApiProduct>;
}

interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  image: string;
  featured: boolean;
  order: number;
  productIds: string[];
}

function normalizeCategory(item: CategoryApi): CategoryRow {
  return {
    _id: item._id,
    name: item.name || '',
    slug: item.slug || '',
    image: item.image || '',
    featured: Boolean(item.featured),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0,
    productIds: Array.isArray(item.productIds)
      ? item.productIds
          .map((product) => (typeof product === 'string' ? product : product?._id || ''))
          .filter(Boolean)
      : [],
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductOption>();
    products.forEach((p) => map.set(p._id, p));
    return map;
  }, [products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoryRes, productRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/products?limit=500`),
      ]);

      const categoryData = await categoryRes.json();
      const productData = await productRes.json();

      const categoryRows: CategoryRow[] = Array.isArray(categoryData)
        ? categoryData.map(normalizeCategory).sort((a: CategoryRow, b: CategoryRow) => a.order - b.order)
        : [];
      const productRows: ProductOption[] = Array.isArray(productData?.products)
        ? productData.products.map((product: ProductOption) => ({
            _id: product._id,
            name: product.name,
          }))
        : [];

      setCategories(categoryRows);
      setProducts(productRows);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete category "${categoryName}"?`)) return;
    const token = localStorage.getItem('adminToken');
    setDeletingId(categoryId);
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Delete failed');
      }
      await fetchData();
    } catch (error) {
      console.error('Delete category error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Manage all categories and assigned products</p>
          </div>
          <Link
            href="/categories/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            + Create New Category
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Products</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Featured</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">No categories found</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {category.image ? (
                        <img
                          src={getImageUrl(category.image)}
                          alt={category.name}
                          className="w-14 h-14 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                          📷
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">{category.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">/{category.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {category.productIds.length === 0 ? (
                        <span className="text-gray-400">No products</span>
                      ) : (
                        <div>
                          <div className="font-medium">{category.productIds.length} selected</div>
                          <div className="text-xs text-gray-500">
                            {category.productIds
                              .slice(0, 2)
                              .map((id) => productMap.get(id)?.name || 'Unknown')
                              .join(', ')}
                            {category.productIds.length > 2 ? ' ...' : ''}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{category.order}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${category.featured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {category.featured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/categories/${category._id}`} className="text-primary-600 hover:text-primary-800 mr-3">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(category._id, category.name)}
                        disabled={deletingId === category._id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingId === category._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
