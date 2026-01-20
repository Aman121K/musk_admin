'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    blogs: 0,
    testimonials: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, blogsRes, testimonialsRes] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/orders`),
        fetch(`${API_URL}/api/blogs`),
        fetch(`${API_URL}/api/testimonials/admin/all`),
      ]);

      const products = await productsRes.json();
      const orders = await ordersRes.json();
      const blogs = await blogsRes.json();
      const testimonials = await testimonialsRes.json();

      setStats({
        products: products.total || products.length || 0,
        orders: orders.length || 0,
        blogs: blogs.length || 0,
        testimonials: testimonials.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Musshk Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/products" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Products</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.products}</p>
          </Link>
          <Link href="/orders" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Orders</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.orders}</p>
          </Link>
          <Link href="/blogs" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Blogs</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.blogs}</p>
          </Link>
          <Link href="/testimonials" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Testimonials</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.testimonials}</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/products/new" className="block text-primary-600 hover:underline">
                + Add New Product
              </Link>
              <Link href="/blogs/new" className="block text-primary-600 hover:underline">
                + Add New Blog Post
              </Link>
              <Link href="/testimonials/new" className="block text-primary-600 hover:underline">
                + Add New Testimonial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

