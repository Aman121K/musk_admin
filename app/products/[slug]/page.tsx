'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

interface Product {
  _id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  tags?: string[];
  notes?: string[];
  bulletPoints?: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${slug}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
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

  if (error || !product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Product not found'}</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Products
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate display price with proper fallback
  const displayPrice = product.price || 0;
  const originalPrice = product.originalPrice || 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/products')}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Back to Products
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600 mt-1">Product Details</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              {product.images && product.images.length > 0 ? (
                <div className="space-y-4">
                  <img
                    src={getImageUrl(product.images[0])}
                    alt={product.name}
                    className="w-full h-96 object-cover rounded-lg border border-gray-200"
                  />
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.slice(1).map((image, index) => (
                        <img
                          key={index}
                          src={getImageUrl(image)}
                          alt={`${product.name} ${index + 2}`}
                          className="w-full h-24 object-cover rounded border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-4xl">📷</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    Rs. {displayPrice.toFixed(2)}
                  </span>
                  {originalPrice && originalPrice > displayPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      Rs. {originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {originalPrice && originalPrice > displayPrice && (
                  <span className="text-sm text-green-600 font-medium">
                    Save Rs. {(originalPrice - displayPrice).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-600">Product Code:</span>
                  <span className="ml-2 text-sm text-gray-900 font-mono">{product.code}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Category:</span>
                  <span className="ml-2 text-sm text-gray-900">{product.category}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Stock:</span>
                  <span className="ml-2 text-sm text-gray-900">{product.stock || 0} units</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Rating:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {product.rating?.toFixed(1) || '0.0'} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>

              {product.bulletPoints && product.bulletPoints.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {product.bulletPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span className="text-sm text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => router.push(`/products/${product._id}`)}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            {product.shortDescription && (
              <p className="text-gray-600 mt-4">{product.shortDescription}</p>
            )}
          </div>

          {/* Notes */}
          {product.notes && product.notes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fragrance Notes</h3>
              <div className="flex flex-wrap gap-2">
                {product.notes.map((note, index) => (
                  <span
                    key={index}
                    className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
