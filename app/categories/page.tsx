'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

interface ProductOption {
  _id: string;
  name: string;
  code?: string;
}

interface CategoryApiProduct {
  _id?: string;
  name?: string;
}

interface CategoryApi {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  featured?: boolean;
  order?: number;
  productIds?: Array<string | CategoryApiProduct>;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  featured: boolean;
  order: number;
  productIds: string[];
}

interface CategoryForm {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  featured: boolean;
  order: number;
  productIds: string[];
}

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  image: '',
  description: '',
  featured: true,
  order: 0,
  productIds: [],
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCategory(item: CategoryApi): Category {
  return {
    _id: item._id,
    name: item.name || '',
    slug: item.slug || '',
    image: item.image || '',
    description: item.description || '',
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
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchAll();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductOption>();
    products.forEach((product) => map.set(product._id, product));
    return map;
  }, [products]);

  const isEditing = Boolean(form._id);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [categoryRes, productRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/products?limit=500`),
      ]);

      const categoryData = await categoryRes.json();
      const productData = await productRes.json();

      const normalizedCategories: Category[] = Array.isArray(categoryData)
        ? categoryData.map(normalizeCategory).sort((a: Category, b: Category) => a.order - b.order)
        : [];

      const normalizedProducts: ProductOption[] = Array.isArray(productData?.products)
        ? productData.products.map((p: ProductOption) => ({
            _id: p._id,
            name: p.name,
            code: p.code,
          }))
        : [];

      setCategories(normalizedCategories);
      setProducts(normalizedProducts);
    } catch (error) {
      console.error('Error loading categories/products:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm(emptyForm);

  const startEdit = (category: Category) => {
    setForm({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      description: category.description,
      featured: category.featured,
      order: category.order,
      productIds: [...category.productIds],
    });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('folder', 'categories');
    setUploading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleProductSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((option) => option.value);
    setForm((prev) => ({ ...prev, productIds: values }));
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      alert('Category name is required');
      return;
    }

    const slug = slugify(form.slug || form.name);
    if (!slug) {
      alert('Slug is required');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('adminToken');

    try {
      const payload = {
        name: form.name.trim(),
        slug,
        image: form.image || '',
        description: form.description || '',
        featured: form.featured,
        order: Number(form.order) || 0,
        productIds: form.productIds,
      };

      const endpoint = form._id
        ? `${API_BASE_URL}/categories/${form._id}`
        : `${API_BASE_URL}/categories`;
      const method = form._id ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save category');
      }

      await fetchAll();
      resetForm();
    } catch (error) {
      console.error('Save category error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    const token = localStorage.getItem('adminToken');
    setDeletingId(category._id);

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${category._id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete category');
      }
      await fetchAll();
      if (form._id === category._id) {
        resetForm();
      }
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
            <p className="text-gray-600 mt-1">
              Manage categories and assign products that should appear under each category.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            + Create New Category
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditing ? 'Edit Category' : 'Create Category'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: prev._id ? prev.slug : slugify(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. Best Seller"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. best-seller"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                />
                Featured on homepage
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Assign products</label>
              <select
                multiple
                value={form.productIds}
                onChange={handleProductSelect}
                className="w-full border rounded-md px-3 py-2 h-44"
              >
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} {product.code ? `(${product.code})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple products.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Category image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border rounded-md"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading image...</p>}
              {form.image && (
                <img
                  src={getImageUrl(form.image)}
                  alt="Category preview"
                  className="mt-3 w-24 h-24 object-cover rounded border"
                />
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={saveCategory}
              disabled={saving}
              className="bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
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
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No categories found
                  </td>
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
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="text-primary-600 hover:text-primary-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category)}
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
