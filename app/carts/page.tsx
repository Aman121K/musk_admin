'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import Layout from '@/components/Layout';

interface Cart {
  _id: string;
  sessionId: string;
  user?: {
    name: string;
    email: string;
  };
  items: Array<{
    productId: {
      name: string;
      images?: string[];
    };
    name: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  shippingAddress?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod?: string;
  createdAt: string;
  expiresAt?: string;
}

export default function CartsPage() {
  const router = useRouter();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchCarts();
  }, [filter]);

  const fetchCarts = async () => {
    try {
      const url = filter === 'all' 
        ? `${API_BASE_URL}/cart/admin/all`
        : `${API_BASE_URL}/cart/admin/pending`;
      const response = await fetch(url);
      const data = await response.json();
      setCarts(data || []);
    } catch (error) {
      console.error('Error fetching carts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Carts</h1>
            <p className="text-gray-600 mt-1">View and manage carts that haven&apos;t been converted to orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {['pending', 'active', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Pending Carts</p>
            <p className="text-2xl font-bold text-yellow-600">
              {carts.filter(c => c.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Active Carts</p>
            <p className="text-2xl font-bold text-blue-600">
              {carts.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              Rs. {carts.reduce((sum, c) => sum + c.total, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Carts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cart ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No carts found
                    </td>
                  </tr>
                ) : (
                  carts.map((cart) => (
                    <tr key={cart._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          #{cart._id.slice(-8)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {cart.sessionId.slice(-12)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cart.user ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">{cart.user.name}</div>
                            <div className="text-sm text-gray-500">{cart.user.email}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">Guest</div>
                        )}
                        {cart.shippingAddress && (
                          <div className="text-xs text-gray-400 mt-1">
                            {cart.shippingAddress.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{cart.items?.length || 0} items</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {cart.items?.slice(0, 2).map((item: any) => item.name).join(', ')}
                          {cart.items?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          Rs. {(cart.total || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cart.status)}`}>
                          {cart.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {cart.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cart.createdAt).toLocaleDateString()}
                        {cart.expiresAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            Expires: {new Date(cart.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            const details = `
Cart ID: ${cart._id.slice(-8)}
Customer: ${cart.user?.name || 'Guest'} (${cart.user?.email || 'N/A'})
Items: ${cart.items?.length || 0}
Total: Rs. ${cart.total}
Status: ${cart.status}
Payment: ${cart.paymentMethod || 'N/A'}
${cart.shippingAddress ? `
Shipping Address:
${cart.shippingAddress.name}
${cart.shippingAddress.address}
${cart.shippingAddress.city}, ${cart.shippingAddress.state} ${cart.shippingAddress.pincode}
Phone: ${cart.shippingAddress.phone}
` : ''}
Items:
${cart.items?.map((i: any) => `- ${i.name} ${i.size ? `(${i.size})` : ''} x${i.quantity} - Rs. ${i.price * i.quantity}`).join('\n')}
                            `;
                            alert(details);
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
