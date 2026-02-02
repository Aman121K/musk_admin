'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import Layout from '@/components/Layout';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      name: string;
      images?: string[];
    };
    name: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDetails?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
  };
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, field: 'orderStatus' | 'paymentStatus', value: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  const handleTrackingUpdate = async (id: string, trackingNumber: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ trackingNumber }),
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating tracking:', error);
      alert('Failed to update tracking number. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus.toLowerCase() === filter.toLowerCase());

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
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Processing</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.orderStatus === 'Processing').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.paymentStatus === 'Paid').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Pending Payment</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.paymentStatus === 'Pending').length}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order #
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
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">#{order.orderNumber || order._id.slice(-8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.user?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.items?.slice(0, 2).map((item: any) => item.name).join(', ')}
                          {order.items?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">Rs. {(order.totalAmount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => handleStatusUpdate(order._id, 'paymentStatus', e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded border-0 ${getPaymentStatusColor(order.paymentStatus)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                          </select>
                          <div className="text-xs text-gray-600 mt-1">
                            {order.paymentMethod}
                          </div>
                          {order.paymentDetails?.razorpay_payment_id && (
                            <div className="text-xs text-gray-500 font-mono mt-1">
                              ID: {order.paymentDetails.razorpay_payment_id.slice(-8)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusUpdate(order._id, 'orderStatus', e.target.value)}
                          className={`text-xs font-medium px-3 py-1 rounded-full border-0 ${getStatusColor(order.orderStatus)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        {order.trackingNumber ? (
                          <div className="text-xs text-gray-600 mt-1">
                            Track: {order.trackingNumber}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Add tracking"
                            onBlur={(e) => {
                              if (e.target.value) {
                                handleTrackingUpdate(order._id, e.target.value);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                handleTrackingUpdate(order._id, e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                            }}
                            className="text-xs mt-1 px-2 py-1 border rounded w-full"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            const details = `
Order #${order.orderNumber}
Customer: ${order.user?.name} (${order.user?.email})
Total: Rs. ${order.totalAmount}
Payment: ${order.paymentStatus} (${order.paymentMethod})
${order.paymentDetails?.razorpay_payment_id ? `Payment ID: ${order.paymentDetails.razorpay_payment_id}` : ''}
Status: ${order.orderStatus}
Shipping: ${order.shippingAddress?.address}, ${order.shippingAddress?.city}
Items: ${order.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
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

