'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserId } from '../../components/UserContext';

export default function HomePage() {
  const userId = useUserId();
  const [searchQuery, setSearchQuery] = useState('');

  const featuredProducts = useQuery(api.products.list, { featured: true });
  const categories = useQuery(api.categories.list);
  const searchResults = useQuery(
    api.products.search,
    searchQuery.length > 2 ? { query: searchQuery } : 'skip'
  );
  const addToCart = useMutation(api.cart.addItem);

  const displayProducts = searchQuery.length > 2 ? searchResults : featuredProducts;

  const handleAddToCart = async (productId: string) => {
    await addToCart({
      userId: userId!,
      productId: productId as any,
      quantity: 1,
    });
  };

  if (!featuredProducts || !categories) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">Hello 👋</p>
        <h1 className="text-2xl font-bold text-gray-900">
          What would you like to order?
        </h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Categories</h2>
            <Link
              href="/categories"
              className="text-sm font-semibold text-primary-500 hover:text-primary-600"
            >
              See All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category._id}
                href={`/categories?id=${category._id}`}
                className="flex-shrink-0 w-[130px] h-[100px] rounded-xl overflow-hidden relative group"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <p className="absolute bottom-3 left-3 text-white text-sm font-semibold">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {searchQuery.length > 2 ? 'Search Results' : 'Featured Products'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayProducts?.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <Link href={`/product/${product._id}`}>
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  {product.discount && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/product/${product._id}`}>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-gray-500 mb-2">{product.unit}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-primary-500">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    className="w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {displayProducts?.length === 0 && (
          <p className="text-center text-gray-500 py-12">No products found</p>
        )}
      </div>
    </div>
  );
}
