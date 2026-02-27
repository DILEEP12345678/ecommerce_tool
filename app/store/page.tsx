'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Plus, Minus, Loader2, Package, MapPin, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserId, useUsername, useCollectionPoint } from '../../components/UserContext';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

export default function HomePage() {
  const userId = useUserId();
  const username = useUsername();
  const userCollectionPoint = useCollectionPoint();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState(userCollectionPoint || '');

  const products = useQuery(api.products.list);
  const collectionPoints = useQuery(api.users.getCollectionPoints);
  const createOrder = useMutation(api.orders.create);

  React.useEffect(() => {
    if (userCollectionPoint && !selectedCollectionPoint) {
      setSelectedCollectionPoint(userCollectionPoint);
    }
  }, [userCollectionPoint, selectedCollectionPoint]);

  const getItemQuantity = (productId: string) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (product: any, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== product.id));
    } else {
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: newQuantity } : item
          );
        }
        return [...prev, { id: product.id, name: product.name, quantity: newQuantity }];
      });
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to your order first');
      return;
    }

    if (!username) {
      toast.error('Please login to place an order');
      return;
    }

    if (!selectedCollectionPoint) {
      toast.error('Please select a collection point');
      return;
    }

    try {
      await createOrder({
        items: cart.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
        })),
        username,
        collectionPoint: selectedCollectionPoint,
      });

      toast.success('Order placed successfully!');
      setCart([]);
      setShowCheckout(false);
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (!products) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-48 sm:pb-32">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-base mb-1">Hello, {username || 'Guest'} 👋</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-5">
          What would you like to order?
        </h1>

        {/* Collection Point Selector */}
        <div className="bg-white rounded-2xl p-5 border-2 border-primary-200 shadow-sm">
          <label className="flex items-start gap-3">
            <MapPin className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-base font-semibold text-gray-800 block mb-2">
                Collection Point
              </span>
              {!collectionPoints ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                  <span className="text-base text-gray-500">Loading...</span>
                </div>
              ) : (
                <select
                  value={selectedCollectionPoint}
                  onChange={(e) => setSelectedCollectionPoint(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a collection point...</option>
                  {collectionPoints.map((point) => (
                    <option key={point} value={point}>
                      {point}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => {
          const quantity = getItemQuantity(product.id);
          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 overflow-hidden border-2 border-gray-100"
            >
              {/* Product Image */}
              <div className="relative w-full h-32 sm:h-44 bg-gray-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Package className="w-10 h-10 text-primary-400" />
                </div>
                {quantity > 0 && (
                  <div className="absolute top-2 right-2 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">{quantity}</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 text-center truncate">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 text-center">
                  {product.category}
                </p>

                {quantity === 0 ? (
                  <button
                    onClick={() => updateQuantity(product, 1)}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-xl text-base flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Order
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product, quantity - 1)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl flex items-center justify-center transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="flex-1 py-3 bg-primary-50 text-primary-700 rounded-xl text-center text-lg font-bold">
                      {quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(product, quantity + 1)}
                      className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Checkout Button — sits above the mobile bottom nav */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-xl p-4 sm:p-5 z-40 animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <span className="text-sm text-gray-600 block">Total Items</span>
                <span className="text-2xl font-bold text-primary-600">{totalItems}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="flex-1 max-w-md py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal — bottom sheet on mobile, centered on desktop */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in-scale shadow-2xl">
            <h2 className="text-2xl font-bold mb-5 text-gray-900">Confirm Your Order</h2>

            {/* Collection Point Info */}
            <div className="mb-5 p-5 bg-primary-50 rounded-xl border-2 border-primary-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-primary-500" />
                <p className="text-sm font-semibold text-primary-700">Collection Point</p>
              </div>
              <p className="text-lg font-bold text-primary-900 ml-7">{selectedCollectionPoint}</p>
            </div>

            {/* Order Summary */}
            <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-base">Order Summary</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-base">
                    <span className="text-gray-700 flex-1">{item.name}</span>
                    <span className="font-bold text-gray-900 ml-3 bg-white px-3 py-1 rounded-lg border border-gray-200">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">Total Items:</span>
                  <span className="text-xl font-bold text-primary-600">{totalItems}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-base transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-base transition-colors"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
