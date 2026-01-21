'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import Layout from '@/components/Layout';

export default function ImportProductsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/import/products`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to import products');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to import products');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Import Products from Excel</h1>
          <p className="text-gray-600 mt-1">Upload an Excel file to bulk import products</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Upload Excel File</h3>
            <p className="text-gray-600 mb-4">
              Upload an Excel file (.xlsx) with product details. The file should include columns like:
              Product Name, Product Code, Description, Price, Category, Images, etc.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition"
              >
                {file ? file.name : 'Choose Excel File'}
              </label>
              {file && (
                <button
                  onClick={() => setFile(null)}
                  className="ml-4 text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800 mb-2">Import Results</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Total rows:</strong> {result.total}</p>
                <p><strong>Successfully imported:</strong> {result.inserted}</p>
                <p><strong>Failed:</strong> {result.failed}</p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold">Errors:</p>
                    <ul className="list-disc list-inside mt-2">
                      {result.errors.slice(0, 10).map((err: string, i: number) => (
                        <li key={i} className="text-red-600">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {uploading ? 'Importing...' : 'Import Products'}
            </button>
            <button
              onClick={() => router.push('/products')}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Excel File Format</h4>
            <p className="text-sm text-gray-700 mb-2">Your Excel file should have these columns:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li><strong>Product Name</strong> (required) - Name of the product</li>
              <li><strong>Product Code</strong> (required) - Unique product code/SKU</li>
              <li><strong>Description</strong> - Full product description</li>
              <li><strong>Short Description</strong> - Brief description</li>
              <li><strong>Price</strong> - Selling price</li>
              <li><strong>Original Price</strong> - MRP/List price</li>
              <li><strong>Category</strong> - Product category</li>
              <li><strong>Stock</strong> - Available stock quantity</li>
              <li><strong>Images</strong> - Comma-separated image URLs</li>
              <li><strong>Tags</strong> - Comma-separated tags</li>
              <li><strong>Notes</strong> - Fragrance notes (comma-separated)</li>
              <li><strong>Rating</strong> - Product rating (1-5)</li>
              <li><strong>Review Count</strong> - Number of reviews</li>
              <li><strong>Featured</strong> - Yes/No</li>
              <li><strong>Best Seller</strong> - Yes/No</li>
              <li><strong>New Arrival</strong> - Yes/No</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

