'use client';

import Layout from '@/components/Layout';
import CategoryEditorForm from '@/components/CategoryEditorForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditCategoryPage({ params }: PageProps) {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
          <p className="text-gray-600 mt-1">Update category details and assigned products</p>
        </div>
        <CategoryEditorForm mode="edit" categoryId={params.id} />
      </div>
    </Layout>
  );
}
