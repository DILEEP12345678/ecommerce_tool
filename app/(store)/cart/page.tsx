'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Loader2, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useUserId } from '../../../components/UserContext';

export default function CartPage() {
  const userId = useUserId();
  const cart = useQuery(api.cart.getUserCart, userId ? { userId } : 'skip');
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);
  const createOrder = useMutation(api.orders.create);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    await updateQuantity({ id: itemId as any, quantity: newQuantity });
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem({ id: itemId as any });
  };

  const handleCheckout = async () => {
    if (!userId || !cart || cart.length === 0) return;

    try {
      const items = cart
        .filter((item) => item.product)
        .map((item) => ({
          productId: item.product!._id,
          name: item.product!.name,
          price: item.product!.price,
          quantity: item.quantity,
          image: item.product!.image,
        }));

      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const deliveryFee = 40;
      const tax = 0;
      const total = subtotal + deliveryFee;

      await createOrder({
        userId: userId as any,
        items,
        subtotal,
        tax,
        deliveryFee,
        total,
        deliveryAddress: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
        },
        paymentMethod: 'Cash on Delivery',
      });

      alert('Order placed successfully!');
    } catch (error: any) {
      alert('Error placing order: ' + error.message);
    }
  };

  if (!cart) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => {
    if (item.product) {
      return sum + item.product.price * item.quantity;
    }
    return sum;
  }, 0);

  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <ShoppingCart className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-500 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-400 mb-6">Add some products to get started</p>
        <Link
          href="/"
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Cart</h1>
        <p className="text-gray-500">{cart.length} items</p>
      </div>

      <div className="lg:flex lg:gap-6">
        {/* Cart Items */}
        <div className="flex-1 space-y-3 mb-6 lg:mb-0">
          {cart.map((item) => {
            if (!item.product) return null;
            return (
              <div
                key={item._id}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-gray-500">{item.product.unit}</p>
                  <p className="text-base font-bold text-primary-500 mt-1">
                    ₹{item.product.price.toFixed(2)}
                  </p>
                </div>
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item._id, item.quantity - 1)
                    }
                    className="w-7 h-7 rounded-lg border border-primary-500 text-primary-500 flex items-center justify-center hover:bg-primary-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item._id, item.quantity + 1)
                    }
                    className="w-7 h-7 rounded-lg border border-primary-500 text-primary-500 flex items-center justify-center hover:bg-primary-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item._id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:w-80">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Order Summary
            </h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  ₹{deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-500">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
