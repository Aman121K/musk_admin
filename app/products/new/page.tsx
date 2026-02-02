'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    category: 'Inspired Perfumes',
    tags: '',
    stock: '',
    featured: false,
    bestSeller: false,
    newArrival: false,
    newArrivalDate: '',
    notes: '',
    rating: '0',
    reviewCount: '0',
  });
  const [collections, setCollections] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const COLLECTIONS = ['Best Seller', 'Niche Edition', 'Inspired Perfumes', 'New Arrivals'];
  const NEW_ARRIVAL_DATES = ['SEPTEMBER - 2025', 'July-2025', 'MARCH- 2025'];

  const handleCollectionChange = (collection: string) => {
    setCollections(prev => 
      prev.includes(collection)
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload/images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setImages([...images, ...data.files.map((f: any) => f.url)]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating) || 0,
        reviewCount: parseInt(formData.reviewCount) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        notes: formData.notes.split(',').map(n => n.trim()).filter(n => n),
        images: images,
        collections: collections,
        newArrivalDate: collections.includes('New Arrivals') ? formData.newArrivalDate : undefined,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      };

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        router.push('/products');
      } else {
        alert('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Fill in the details to create a new product</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Product Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Auto-generated from name if empty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Short Description</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Original Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stock *</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
            >
              <option>Inspired Perfumes</option>
              <option>Niche Edition</option>
              <option>Luxe Edition</option>
              <option>Gift Sets</option>
              <option>Body Lotions</option>
              <option>Shower Gel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Men, Best Seller, Luxury"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (comma separated)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Bergamot, Pepper, Lavender"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Rating (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review Count</label>
              <input
                type="number"
                min="0"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Collections</label>
            <p className="text-xs text-gray-500 mb-3">Select which collections this product belongs to:</p>
            <div className="grid grid-cols-2 gap-3">
              {COLLECTIONS.map(collection => (
                <label key={collection} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collections.includes(collection)}
                    onChange={() => handleCollectionChange(collection)}
                    className="mr-2"
                  />
                  <span className="text-sm">{collection}</span>
                </label>
              ))}
            </div>
            {collections.includes('New Arrivals') && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">New Arrival Date</label>
                <select
                  value={formData.newArrivalDate}
                  onChange={(e) => setFormData({ ...formData, newArrivalDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Select date</option>
                  {NEW_ARRIVAL_DATES.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex space-x-4 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="mr-2"
              />
              Featured
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.bestSeller}
                onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
                className="mr-2"
              />
              Best Seller
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.newArrival}
                onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                className="mr-2"
              />
              New Arrival
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Product Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-2 border rounded-md"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            <div className="grid grid-cols-4 gap-4 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img src={getImageUrl(image)} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
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

