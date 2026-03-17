'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';

interface ProductOption {
  _id: string;
  name: string;
  code?: string;
}

interface CategoryApiProduct {
  _id?: string;
}

interface CategoryApi {
  _id?: string;
  name?: string;
  slug?: string;
  image?: string;
  description?: string;
  featured?: boolean;
  order?: number;
  productIds?: Array<string | CategoryApiProduct>;
}

interface CategoryForm {
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

function normalizeCategory(item?: CategoryApi): CategoryForm {
  if (!item) return emptyForm;
  return {
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

interface Props {
  mode: 'create' | 'edit';
  categoryId?: string;
}

export default function CategoryEditorForm({ mode, categoryId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [mode, categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests: Promise<Response>[] = [fetch(`${API_BASE_URL}/products?limit=500`)];
      if (mode === 'edit' && categoryId) {
        requests.unshift(fetch(`${API_BASE_URL}/categories/id/${categoryId}`));
      }

      const responses = await Promise.all(requests);

      let categoryData: CategoryApi | undefined;
      let productData: { products?: ProductOption[] } | undefined;

      if (mode === 'edit' && categoryId) {
        categoryData = await responses[0].json();
        productData = await responses[1].json();
      } else {
        productData = await responses[0].json();
      }

      if (mode === 'edit' && categoryId && !responses[0].ok) {
        throw new Error((categoryData as { error?: string })?.error || 'Failed to load category');
      }

      const normalizedProducts: ProductOption[] = Array.isArray(productData?.products)
        ? productData.products.map((p) => ({ _id: p._id, name: p.name, code: p.code }))
        : [];

      setProducts(normalizedProducts);
      setForm(normalizeCategory(categoryData));
    } catch (error) {
      console.error('Failed to load editor data:', error);
      alert('Failed to load category form data');
      router.push('/categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      `${product.name} ${product.code || ''}`.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const selectedProductLabel = useMemo(() => {
    if (form.productIds.length === 0) return 'Select products';
    if (form.productIds.length === 1) {
      const selected = products.find((p) => p._id === form.productIds[0]);
      return selected ? selected.name : '1 product selected';
    }
    return `${form.productIds.length} products selected`;
  }, [form.productIds, products]);

  const toggleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
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

      const endpoint = mode === 'edit' && categoryId
        ? `${API_BASE_URL}/categories/${categoryId}`
        : `${API_BASE_URL}/categories`;
      const method = mode === 'edit' ? 'PUT' : 'POST';

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

      router.push('/categories');
    } catch (error) {
      console.error('Save category error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {mode === 'edit' ? 'Edit Category' : 'Create Category'}
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
                slug: mode === 'create' ? slugify(e.target.value) : prev.slug,
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setProductPickerOpen((prev) => !prev)}
              className="w-full px-3 py-2 border rounded-md text-left bg-white"
            >
              {selectedProductLabel}
            </button>
            {productPickerOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border rounded-md shadow-lg p-3">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product by name or code..."
                  className="w-full px-3 py-2 border rounded-md mb-3"
                />
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 px-1 py-1">No matching products</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <label key={product._id} className="flex items-start gap-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(product._id)}
                          onChange={() => toggleProduct(product._id)}
                          className="mt-0.5"
                        />
                        <span>
                          {product.name} {product.code ? `(${product.code})` : ''}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="mt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, productIds: [] }))}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductPickerOpen(false)}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
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

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={saveCategory}
          disabled={saving}
          className="bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : mode === 'edit' ? 'Update Category' : 'Create Category'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/categories')}
          className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
