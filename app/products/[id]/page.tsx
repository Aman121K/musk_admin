'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE_URL, getImageUrl } from '@/lib/api';
import Layout from '@/components/Layout';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    slug: '',
    description: '',
    shortDescription: '',
    ingredients: '',
    packagingAndRecycling: '',
    price: '',
    originalPrice: '',
    category: 'Inspired Perfumes',
    tags: '',
    stock: '',
    featured: false,
    bestSeller: false,
    newArrival: false,
    newArrivalDate: '',
    rating: '0',
    reviewCount: '0',
  });
  const [collections, setCollections] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [bulletPoints, setBulletPoints] = useState<string[]>(['']);
  const [topNotes, setTopNotes] = useState<string[]>(['']);
  const [heartNotes, setHeartNotes] = useState<string[]>(['']);
  const [baseNotes, setBaseNotes] = useState<string[]>(['']);
  const [otherNotes, setOtherNotes] = useState<string[]>(['']);
  const [topNotesImage, setTopNotesImage] = useState('');
  const [heartNotesImage, setHeartNotesImage] = useState('');
  const [baseNotesImage, setBaseNotesImage] = useState('');
  const [uploadingNoteImage, setUploadingNoteImage] = useState<string | null>(null);

  const COLLECTIONS = ['Best Seller', 'Niche Edition', 'Inspired Perfumes', 'New Arrivals'];
  const NEW_ARRIVAL_DATES = ['SEPTEMBER - 2025', 'July-2025', 'MARCH- 2025'];

  const handleCollectionChange = (collection: string) => {
    setCollections(prev => 
      prev.includes(collection)
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      // Use the new /id/:id endpoint
      const response = await fetch(`${API_BASE_URL}/products/id/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const product = await response.json();
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      setFormData({
        name: product.name || '',
        code: product.code || '',
        slug: product.slug || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        ingredients: product.ingredients || '',
        packagingAndRecycling: product.packagingAndRecycling || '',
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        category: product.category || 'Inspired Perfumes',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        stock: product.stock?.toString() || '',
        featured: product.featured || false,
        bestSeller: product.bestSeller || false,
        newArrival: product.newArrival || false,
        newArrivalDate: product.newArrivalDate || '',
        rating: product.rating?.toString() || '0',
        reviewCount: product.reviewCount?.toString() || '0',
      });
      setCollections(Array.isArray(product.collections) ? product.collections : []);
      setImages(product.images || []);
      setBulletPoints(
        Array.isArray(product.bulletPoints) && product.bulletPoints.length > 0
          ? product.bulletPoints
          : ['']
      );
      setTopNotes(Array.isArray(product.topNotes) && product.topNotes.length > 0 ? product.topNotes : ['']);
      setHeartNotes(Array.isArray(product.heartNotes) && product.heartNotes.length > 0 ? product.heartNotes : ['']);
      setBaseNotes(Array.isArray(product.baseNotes) && product.baseNotes.length > 0 ? product.baseNotes : ['']);
      setOtherNotes(Array.isArray(product.otherNotes) && product.otherNotes.length > 0 ? product.otherNotes : ['']);
      setTopNotesImage(product.topNotesImage || '');
      setHeartNotesImage(product.heartNotesImage || '');
      setBaseNotesImage(product.baseNotesImage || '');
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    const token = localStorage.getItem('adminToken');
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const contentType = file.type || 'image/jpeg';
        const filename = file.name || `image-${Date.now()}.jpg`;

        // Try direct-to-S3 presigned URL first (no file through API = no 413)
        const presignRes = await fetch(
          `${API_BASE_URL}/upload/presign?folder=products&filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const presignData = await presignRes.json();

        if (presignRes.ok && presignData.uploadUrl && presignData.publicUrl) {
          const putRes = await fetch(presignData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': contentType },
          });
          if (putRes.ok) {
            uploadedUrls.push(presignData.publicUrl);
          } else {
            console.error('S3 PUT failed for', file.name);
          }
        } else {
          // Fallback: upload via API (when S3 presign not configured or fails)
          const formData = new FormData();
          formData.append('image', file);
          const response = await fetch(`${API_BASE_URL}/upload/image?folder=products`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          const data = await response.json();
          if (data.success && data.url) {
            uploadedUrls.push(data.url);
          } else {
            console.error('Upload failed for', file.name, data);
          }
        }
      }
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
      }
      if (uploadedUrls.length < files.length) {
        alert(`Uploaded ${uploadedUrls.length} of ${files.length} images. Some may have failed.`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadNoteImage = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNoteImage(field);
    const token = localStorage.getItem('adminToken');
    try {
      const contentType = file.type || 'image/jpeg';
      const filename = file.name || `note-${Date.now()}.jpg`;
      const presignRes = await fetch(
        `${API_BASE_URL}/upload/presign?folder=products&filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const presignData = await presignRes.json();
      if (presignRes.ok && presignData.uploadUrl && presignData.publicUrl) {
        const putRes = await fetch(presignData.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } });
        if (putRes.ok) {
          setter(presignData.publicUrl);
        }
      } else {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_BASE_URL}/upload/image?folder=products`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) setter(data.url);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploadingNoteImage(null);
    }
    e.target.value = '';
  };

  const addBulletPoint = () => {
    setBulletPoints([...bulletPoints, '']);
  };

  const removeBulletPoint = (index: number) => {
    setBulletPoints(bulletPoints.filter((_, i) => i !== index));
  };

  const updateBulletPoint = (index: number, value: string) => {
    const updated = [...bulletPoints];
    updated[index] = value;
    setBulletPoints(updated);
  };

  const addNote = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[]) => setter([...current, '']);
  const removeNote = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], index: number) => setter(current.filter((_, i) => i !== index));
  const updateNote = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], index: number, value: string) => {
    const updated = [...current];
    updated[index] = value;
    setter(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating) || 0,
        reviewCount: parseInt(formData.reviewCount) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        topNotes: topNotes.filter(n => n.trim() !== ''),
        heartNotes: heartNotes.filter(n => n.trim() !== ''),
        baseNotes: baseNotes.filter(n => n.trim() !== ''),
        otherNotes: otherNotes.filter(n => n.trim() !== ''),
        topNotesImage: topNotesImage || undefined,
        heartNotesImage: heartNotesImage || undefined,
        baseNotesImage: baseNotesImage || undefined,
        bulletPoints: bulletPoints.filter(bp => bp.trim() !== ''),
        ingredients: formData.ingredients?.trim() || undefined,
        packagingAndRecycling: formData.packagingAndRecycling?.trim() || undefined,
        images: images,
        collections: collections,
        newArrivalDate: collections.includes('New Arrivals') ? formData.newArrivalDate : undefined,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      };

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        router.push('/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product details</p>
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

            <div>
              <label className="block text-sm font-medium mb-2">Ingredients</label>
              <p className="text-xs text-gray-500 mb-1">Shown in the &quot;Ingredients&quot; tab on the product page.</p>
              <textarea
                rows={3}
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="e.g. Alcohol, Fragrance, Water, ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Packaging and recycling</label>
              <p className="text-xs text-gray-500 mb-1">Shown in the &quot;Packaging and recycling&quot; tab on the product page.</p>
              <textarea
                rows={4}
                value={formData.packagingAndRecycling}
                onChange={(e) => setFormData({ ...formData, packagingAndRecycling: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="e.g. Many packaging components are recyclable. We recommend..."
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

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Fragrance Notes</label>
              <p className="text-xs text-gray-500 mb-3">Add Top, Heart, and Base notes. Use &quot;Other notes&quot; for any additional notes.</p>
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Top notes</span>
                  <div className="space-y-2">
                    {topNotes.map((note, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => updateNote(setTopNotes, topNotes, index, e.target.value)}
                          placeholder="e.g. Bergamot, Lemon"
                          className="flex-1 px-4 py-2 border rounded-md"
                        />
                        {topNotes.length > 1 && (
                          <button type="button" onClick={() => removeNote(setTopNotes, topNotes, index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addNote(setTopNotes, topNotes)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">+ Add Top note</button>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Image for Top notes (shown on product page)</span>
                    <input type="file" accept="image/*" onChange={(e) => uploadNoteImage(e, setTopNotesImage, 'top')} className="w-full text-sm" disabled={uploadingNoteImage === 'top'} />
                    {uploadingNoteImage === 'top' && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                    {topNotesImage && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={getImageUrl(topNotesImage)} alt="Top notes" className="h-20 w-auto object-contain rounded border border-gray-200" />
                        <button type="button" onClick={() => setTopNotesImage('')} className="text-red-600 text-sm">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Heart notes</span>
                  <div className="space-y-2">
                    {heartNotes.map((note, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => updateNote(setHeartNotes, heartNotes, index, e.target.value)}
                          placeholder="e.g. Lavender, Rose"
                          className="flex-1 px-4 py-2 border rounded-md"
                        />
                        {heartNotes.length > 1 && (
                          <button type="button" onClick={() => removeNote(setHeartNotes, heartNotes, index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addNote(setHeartNotes, heartNotes)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">+ Add Heart note</button>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Image for Heart notes (shown on product page)</span>
                    <input type="file" accept="image/*" onChange={(e) => uploadNoteImage(e, setHeartNotesImage, 'heart')} className="w-full text-sm" disabled={uploadingNoteImage === 'heart'} />
                    {uploadingNoteImage === 'heart' && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                    {heartNotesImage && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={getImageUrl(heartNotesImage)} alt="Heart notes" className="h-20 w-auto object-contain rounded border border-gray-200" />
                        <button type="button" onClick={() => setHeartNotesImage('')} className="text-red-600 text-sm">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Base notes</span>
                  <div className="space-y-2">
                    {baseNotes.map((note, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => updateNote(setBaseNotes, baseNotes, index, e.target.value)}
                          placeholder="e.g. Vetiver, Sandalwood"
                          className="flex-1 px-4 py-2 border rounded-md"
                        />
                        {baseNotes.length > 1 && (
                          <button type="button" onClick={() => removeNote(setBaseNotes, baseNotes, index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addNote(setBaseNotes, baseNotes)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">+ Add Base note</button>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Image for Base notes (shown on product page)</span>
                    <input type="file" accept="image/*" onChange={(e) => uploadNoteImage(e, setBaseNotesImage, 'base')} className="w-full text-sm" disabled={uploadingNoteImage === 'base'} />
                    {uploadingNoteImage === 'base' && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                    {baseNotesImage && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={getImageUrl(baseNotesImage)} alt="Base notes" className="h-20 w-auto object-contain rounded border border-gray-200" />
                        <button type="button" onClick={() => setBaseNotesImage('')} className="text-red-600 text-sm">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Other notes</span>
                  <p className="text-xs text-gray-500 mb-2">Add any other fragrance notes if needed.</p>
                  <div className="space-y-2">
                    {otherNotes.map((note, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => updateNote(setOtherNotes, otherNotes, index, e.target.value)}
                          placeholder="e.g. Musk, Amber"
                          className="flex-1 px-4 py-2 border rounded-md"
                        />
                        {otherNotes.length > 1 && (
                          <button type="button" onClick={() => removeNote(setOtherNotes, otherNotes, index)} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addNote(setOtherNotes, otherNotes)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">+ Add another note</button>
                  </div>
                </div>
              </div>
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
              <p className="text-xs text-gray-500 mb-2">You can upload multiple images (up to 20 images)</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border rounded-md"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Uploaded Images ({images.length})</p>
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={getImageUrl(image)} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bullet Points</label>
              <p className="text-xs text-gray-500 mb-2">Add key features or highlights that will be displayed on the website</p>
              <div className="space-y-2">
                {bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateBulletPoint(index, e.target.value)}
                      placeholder={`Bullet point ${index + 1}`}
                      className="flex-1 px-4 py-2 border rounded-md"
                    />
                    {bulletPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBulletPoint(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBulletPoint}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
                >
                  + Add Bullet Point
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Product'}
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

