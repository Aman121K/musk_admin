'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Testimonial {
  _id: string;
  name: string;
  product: string;
  rating: number;
  comment: string;
  image: string;
  approved: boolean;
  featured: boolean;
}

export default function TestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`${API_URL}/api/testimonials/admin/all`);
      const data = await response.json();
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (id: string, approved: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/testimonials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: !approved }),
      });
      fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              Musshk Admin
            </Link>
            <Link href="/testimonials/new" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
              + Add Testimonial
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-8">Testimonials</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                {testimonial.image ? (
                  <img
                    src={`${API_URL}${testimonial.image}`}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500">{testimonial.product}</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating ? 'fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">{testimonial.comment}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  testimonial.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {testimonial.approved ? 'Approved' : 'Pending'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleApproval(testimonial._id, testimonial.approved)}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {testimonial.approved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

