'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ArrowLeft, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '../../../../components/UserContext';
import { useEffect } from 'react';

// Product image mapping
const PRODUCT_IMAGES: Record<string, string> = {
  'PROD-001': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop',
  'PROD-002': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
  'PROD-003': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'PROD-004': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'PROD-005': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
  'PROD-006': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop',
  'PROD-007': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop',
  'PROD-008': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  'PROD-009': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop',
  'PROD-010': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useUser();
  const orderId = params.orderId as string;

  // Direct query for single order
  const order = useQuery(
    api.orders.getByOrderId,
    orderId ? { orderId } : 'skip'
  );

  // Redirect to login if not logged in or not an admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  if (order === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order #{order.orderId.split('-')[1]}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <User className="w-4 h-4" />
              <span className="text-sm">Customer: {order.username}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Collection Point: {order.collectionPoint}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {new Date(order.createdAt).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <div>
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${getStatusColor(
                order.status
              )}`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status Timeline</h2>

        <div className="space-y-6">
          {/* Confirmed */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100 border-2 border-yellow-500">
                <CheckCircle2 className="w-5 h-5 text-yellow-600" />
              </div>
              <div className={`w-0.5 h-16 ${
                order.status === 'packed' || order.status === 'collected'
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`} />
            </div>
            <div className="flex-1 pb-8">
              <h3 className="text-sm font-semibold text-gray-900">Order Confirmed</h3>
              <p className="text-xs text-gray-500 mt-1">
                Order has been confirmed and is being packed
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(order.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Packed */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                order.status === 'packed' || order.status === 'collected'
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}>
                {order.status === 'packed' || order.status === 'collected' ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              {order.status !== 'packed' && (
                <div className={`w-0.5 h-16 ${
                  order.status === 'collected'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-8">
              <h3 className="text-sm font-semibold text-gray-900">Packed & Ready</h3>
              <p className="text-xs text-gray-500 mt-1">
                {order.status === 'packed' || order.status === 'collected'
                  ? 'Order is packed and ready for collection'
                  : 'Waiting for collection point to pack the order'}
              </p>
            </div>
          </div>

          {/* Collected */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                order.status === 'collected'
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}>
                {order.status === 'collected' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Collected</h3>
              <p className="text-xs text-gray-500 mt-1">
                {order.status === 'collected'
                  ? 'Order has been collected by customer'
                  : 'Pending collection'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Order Items</h2>
        <div className="space-y-2">
          {order.items.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {/* Product Image */}
                <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {PRODUCT_IMAGES[item.itemId] ? (
                    <img
                      src={PRODUCT_IMAGES[item.itemId]}
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                  <p className="text-xs text-gray-500">{item.itemId}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">×{item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    packed: 'bg-blue-100 text-blue-800 border border-blue-200',
    collected: 'bg-green-100 text-green-800 border border-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
