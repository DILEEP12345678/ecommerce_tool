'use client';

import { useMutation, useQuery } from 'convex/react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';

export default function AdminCategoriesPage() {
  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const deleteCategory = useMutation(api.categories.remove);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    displayOrder: '',
    isActive: Boolean(false),
    image: '',
    name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!categories) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      displayOrder: '',
      isActive: Boolean(false),
      image: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.displayOrder || !formData.image || !formData.isActive) return;

    setSubmitting(true);
    try {
      await createCategory({
        name: formData.name,
        description: formData.description,
        displayOrder: parseInt(formData.displayOrder),
        image: formData.image,
        isActive: formData.isActive
      });
      resetForm();
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory({ id: id as any });
    }
  };

  return (
    <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
      >
        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {showForm ? 'Cancel' : 'Add Category'}
      </button>
    </div>
    {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                isActive *
              </label>
              <select
                required
                value={formData.isActive.toString()}
                onChange={(e) => setFormData({ ...formData, isActive: Boolean(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order *</label>
                <input
                  type="number"
                  required
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL *
              </label>
              <input
                type="url"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            </div>
            <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Category
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

<div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                isActive
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {category.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                <p className="text-xs text-gray-500">{category.displayOrder}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {category.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {category.isActive}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products yet. Click "Add Product" to create one.
          </div>
        )}
      </div>

    </div>
  );
}
