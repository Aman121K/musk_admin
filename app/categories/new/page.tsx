'use client';

import Layout from '@/components/Layout';
import CategoryEditorForm from '@/components/CategoryEditorForm';

export default function CreateCategoryPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Category</h1>
          <p className="text-gray-600 mt-1">Create a new category and assign products</p>
        </div>
        <CategoryEditorForm mode="create" />
      </div>
    </Layout>
  );
}
