'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

// Utility function to truncate text
const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

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
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredOrders = orders.filter(order => {
    const matchesStatusFilter = filter === 'all' || order.orderStatus.toLowerCase() === filter.toLowerCase();
    const matchesPaymentFilter = paymentFilter === 'all' || order.paymentStatus.toLowerCase() === paymentFilter.toLowerCase();
    const matchesSearch = !searchTerm || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some((item: any) => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatusFilter && matchesPaymentFilter && matchesSearch;
  });

  const toggleItemExpansion = (orderId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
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
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by order number, customer name, email, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear search
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Order Status</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filter === status
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Payment Status</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'paid', 'pending', 'failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setPaymentFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      paymentFilter === status
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-blue-900">{orders.length}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm border border-indigo-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700 mb-1">Processing</p>
                <p className="text-3xl font-bold text-indigo-900">
                  {orders.filter(o => o.orderStatus === 'Processing').length}
                </p>
              </div>
              <div className="text-3xl">⚙️</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Paid</p>
                <p className="text-3xl font-bold text-green-900">
                  {orders.filter(o => o.paymentStatus === 'Paid').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm border border-yellow-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Pending Payment</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {orders.filter(o => o.paymentStatus === 'Pending').length}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
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
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          {searchTerm || filter !== 'all' || paymentFilter !== 'all' 
                            ? 'No orders match your filters' 
                            : 'No orders found'}
                        </p>
                        <p className="text-gray-600 mb-4">
                          {searchTerm || filter !== 'all' || paymentFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Orders will appear here once customers place them'}
                        </p>
                        {(searchTerm || filter !== 'all' || paymentFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilter('all');
                              setPaymentFilter('all');
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isExpanded = expandedItems.has(order._id);
                    const customerName = order.user?.name || 'N/A';
                    const customerEmail = order.user?.email || '';
                    
                    return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 font-mono">
                          #{order.orderNumber || order._id.slice(-12).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div 
                              className="text-sm font-medium text-gray-900 truncate" 
                              title={customerName}
                            >
                              {truncateText(customerName, 20)}
                            </div>
                            <div 
                              className="text-xs text-gray-500 truncate" 
                              title={customerEmail}
                            >
                              {truncateText(customerEmail, 25)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[300px]">
                        <div className="flex items-start space-x-2">
                          {order.items?.[0]?.product?.images?.[0] && (
                            <img 
                              src={getImageUrl(order.items[0].product.images[0])} 
                              alt="Product"
                              className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                            </div>
                            {order.items && order.items.length > 0 && (
                              <div className="text-xs text-gray-600">
                                {isExpanded ? (
                                  <div className="space-y-1">
                                    {order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-start">
                                        <span className="text-gray-400 mr-2">•</span>
                                        <span className="flex-1">{item.name || item.product?.name || 'Unknown Product'}</span>
                                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => toggleItemExpansion(order._id)}
                                      className="text-primary-600 hover:text-primary-700 text-xs mt-1"
                                    >
                                      Show less
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="line-clamp-2">
                                      {order.items[0]?.name || order.items[0]?.product?.name || 'Unknown Product'}
                                    </div>
                                    {order.items.length > 1 && (
                                      <span className="text-gray-400">+ {order.items.length - 1} more</span>
                                    )}
                                    {order.items.length > 0 && (
                                      <button
                                        onClick={() => toggleItemExpansion(order._id)}
                                        className="text-primary-600 hover:text-primary-700 text-xs mt-1 block"
                                      >
                                        View all items
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">Rs. {(order.totalAmount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 min-w-[150px]">
                        <div className="space-y-2">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => handleStatusUpdate(order._id, 'paymentStatus', e.target.value)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer ${getPaymentStatusColor(order.paymentStatus)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                          </select>
                          <div className="text-xs text-gray-600 font-medium">
                            {order.paymentMethod || 'N/A'}
                          </div>
                          {order.paymentDetails?.razorpay_payment_id && (
                            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                              ID: {order.paymentDetails.razorpay_payment_id.slice(-8)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[180px]">
                        <div className="space-y-2">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(order._id, 'orderStatus', e.target.value)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer w-full ${getStatusColor(order.orderStatus)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          {order.trackingNumber ? (
                            <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              📦 {truncateText(order.trackingNumber, 20)}
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Add tracking number"
                              onBlur={(e) => {
                                if (e.target.value.trim()) {
                                  handleTrackingUpdate(order._id, e.target.value.trim());
                                }
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                  handleTrackingUpdate(order._id, e.currentTarget.value.trim());
                                  e.currentTarget.blur();
                                }
                              }}
                              className="text-xs mt-1 px-2 py-1 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-800 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details - #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedOrder.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedOrder.user?.email || 'N/A'}</p>
                    </div>
                    {selectedOrder.shippingAddress?.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.pincode}
                      </p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                      {selectedOrder.shippingAddress.phone && (
                        <p className="mt-2">Phone: {selectedOrder.shippingAddress.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                        {item.product?.images?.[0] && (
                          <img
                            src={getImageUrl(item.product.images[0])}
                            alt={item.name || item.product?.name}
                            className="w-20 h-20 object-cover rounded border border-gray-200 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {item.name || item.product?.name || 'Unknown Product'}
                          </p>
                          {item.size && (
                            <p className="text-sm text-gray-600">Size: {item.size}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            <p className="font-semibold text-gray-900">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium mt-1 ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium text-gray-900">{selectedOrder.paymentMethod || 'N/A'}</p>
                    </div>
                    {selectedOrder.paymentDetails?.razorpay_payment_id && (
                      <div>
                        <p className="text-sm text-gray-600">Payment ID</p>
                        <p className="font-mono text-sm text-gray-900">{selectedOrder.paymentDetails.razorpay_payment_id}</p>
                      </div>
                    )}
                    {selectedOrder.paymentDetails?.razorpay_order_id && (
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-mono text-sm text-gray-900">{selectedOrder.paymentDetails.razorpay_order_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        Rs. {(selectedOrder.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-primary-200">
                      <span className="font-bold text-lg text-gray-900">Total</span>
                      <span className="font-bold text-lg text-gray-900">
                        Rs. {(selectedOrder.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Status & Tracking */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Status & Tracking</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Order Status</p>
                      <select
                        value={selectedOrder.orderStatus}
                        onChange={(e) => {
                          handleStatusUpdate(selectedOrder._id, 'orderStatus', e.target.value);
                          setSelectedOrder({ ...selectedOrder, orderStatus: e.target.value });
                        }}
                        className={`text-sm font-medium px-3 py-2 rounded-lg border-0 ${getStatusColor(selectedOrder.orderStatus)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tracking Number</p>
                      {selectedOrder.trackingNumber ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-300">
                            {selectedOrder.trackingNumber}
                          </span>
                          <button
                            onClick={() => {
                              const newTracking = prompt('Enter new tracking number:', selectedOrder.trackingNumber);
                              if (newTracking !== null) {
                                handleTrackingUpdate(selectedOrder._id, newTracking);
                                setSelectedOrder({ ...selectedOrder, trackingNumber: newTracking });
                              }
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Add tracking number"
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleTrackingUpdate(selectedOrder._id, e.target.value.trim());
                              setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value.trim() });
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              handleTrackingUpdate(selectedOrder._id, e.currentTarget.value.trim());
                              setSelectedOrder({ ...selectedOrder, trackingNumber: e.currentTarget.value.trim() });
                              e.currentTarget.blur();
                            }
                          }}
                          className="text-sm px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Order Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedOrder.updatedAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

