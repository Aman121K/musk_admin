'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import Layout from '@/components/Layout';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  href: string;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, href, color, trend }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-bl-full`}></div>
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">{title}</h3>
        <p className="text-4xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {value.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    blogs: 0,
    testimonials: 0,
    users: 0,
    banners: 0,
    discounts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Check if user is admin
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        if (user.role !== 'admin') {
          router.push('/unauthorized');
          return;
        }
      } catch (error) {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
    
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, blogsRes, testimonialsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/blogs`),
        fetch(`${API_BASE_URL}/testimonials/admin/all`),
        fetch(`${API_BASE_URL}/users`).catch(() => null),
      ]);

      const products = await productsRes.json();
      const orders = await ordersRes.json();
      const blogs = await blogsRes.json();
      const testimonials = await testimonialsRes.json();
      const users = usersRes ? await usersRes.json() : [];

      setStats({
        products: products.total || products.length || 0,
        orders: orders.length || 0,
        blogs: blogs.length || 0,
        testimonials: testimonials.length || 0,
        users: users.length || 0,
        banners: 0,
        discounts: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Products"
            value={stats.products}
            icon="🛍️"
            href="/products"
            color="bg-blue-500"
            trend="+12%"
          />
          <StatCard
            title="Orders"
            value={stats.orders}
            icon="📦"
            href="/orders"
            color="bg-green-500"
            trend="+8%"
          />
          <StatCard
            title="Users"
            value={stats.users}
            icon="👥"
            href="/users"
            color="bg-purple-500"
            trend="+15%"
          />
          <StatCard
            title="Testimonials"
            value={stats.testimonials}
            icon="💬"
            href="/testimonials"
            color="bg-yellow-500"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Blogs"
            value={stats.blogs}
            icon="📝"
            href="/blogs"
            color="bg-indigo-500"
          />
          <StatCard
            title="Banners"
            value={stats.banners}
            icon="🖼️"
            href="/banners"
            color="bg-pink-500"
          />
          <StatCard
            title="Discounts"
            value={stats.discounts}
            icon="🎫"
            href="/discounts"
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/products/new"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">➕</span>
                  <span className="font-medium text-gray-700 group-hover:text-primary-700">Add New Product</span>
                </div>
                <span className="text-gray-400 group-hover:text-primary-600">→</span>
              </Link>
              <Link
                href="/products/import"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📥</span>
                  <span className="font-medium text-gray-700 group-hover:text-primary-700">Import Products</span>
                </div>
                <span className="text-gray-400 group-hover:text-primary-600">→</span>
              </Link>
              <Link
                href="/testimonials/new"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⭐</span>
                  <span className="font-medium text-gray-700 group-hover:text-primary-700">Add New Testimonial</span>
                </div>
                <span className="text-gray-400 group-hover:text-primary-600">→</span>
              </Link>
              <Link
                href="/banners/new"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🖼️</span>
                  <span className="font-medium text-gray-700 group-hover:text-primary-700">Add New Banner</span>
                </div>
                <span className="text-gray-400 group-hover:text-primary-600">→</span>
              </Link>
            </div>
          </div>

          {/* Overview */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-sm border border-primary-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Total Products</span>
                <span className="font-bold text-gray-900">{stats.products}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-bold text-gray-900">{stats.orders}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Total Users</span>
                <span className="font-bold text-gray-900">{stats.users}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Total Testimonials</span>
                <span className="font-bold text-gray-900">{stats.testimonials}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

