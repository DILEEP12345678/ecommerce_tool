'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useUserId } from '../../../components/UserContext';

export default function CategoriesPage() {
  const userId = useUserId();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');

  const categories = useQuery(api.categories.list);
  const products = useQuery(
    api.products.list,
    selectedId ? { categoryId: selectedId as any } : {}
  );
  const addToCart = useMutation(api.cart.addItem);

  const handleAddToCart = async (productId: string) => {
    await addToCart({
      userId: userId!,
      productId: productId as any,
      quantity: 1,
    });
  };

  if (!categories || !products) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      <div className="flex gap-6">
        {/* Left Sidebar - Category List */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => router.push(`/categories?id=${category._id}`)}
                className={`w-full text-left p-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                  selectedId === category._id
                    ? 'bg-primary-50 border-l-4 border-l-primary-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-16 object-cover rounded-lg mb-2"
                />
                <p className="text-xs font-semibold text-gray-900 text-center">
                  {category.name}
                </p>
                <p className="text-[10px] text-gray-500 text-center line-clamp-1">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Products Grid */}
        <div className="flex-1">
          {selectedId ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <Link href={`/product/${product._id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                    />
                  </Link>
                  <div className="p-3">
                    <Link href={`/product/${product._id}`}>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-bold text-primary-500">
                        ₹{product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product._id)}
                        className="w-7 h-7 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : 'Out of stock'}
                    </p>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-500">
                    No products in this category
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg">
                Select a category to browse products
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
