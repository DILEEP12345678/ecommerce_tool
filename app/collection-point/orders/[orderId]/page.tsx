'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ArrowLeft, Clock } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useCollectionPoint, useUser } from '../../../../components/UserContext';
import { useEffect } from 'react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useUser();
  const collectionPoint = useCollectionPoint();
  const orderId = params.orderId as string;

  // Direct query for single order - much faster!
  const order = useQuery(
    api.orders.getByOrderId,
    orderId ? { orderId } : 'skip'
  );
  const updateStatus = useMutation(api.orders.updateStatus);

  // Redirect to login if not logged in or not a manager
  useEffect(() => {
    if (!user || user.role !== 'collection_point_manager') {
      router.push('/login');
    }
  }, [user, router]);

  if (order === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        orderId: order.orderId,
        status: newStatus as any,
      });
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/collection-point')}
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

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
              </div>
              <div className="text-sm text-gray-600">
                Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Actions</h2>

        {order.status === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange('ready')}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Mark as Ready for Collection
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel Order
            </button>
          </div>
        )}

        {order.status === 'ready' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange('collected')}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Mark as Collected
            </button>
            <button
              onClick={() => handleStatusChange('pending')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Move Back to Pending
            </button>
          </div>
        )}

        {order.status === 'collected' && (
          <div className="text-center py-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <p className="text-sm font-semibold">✓ This order has been collected</p>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="text-center py-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="text-sm font-semibold">✗ This order has been cancelled</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    ready: 'bg-blue-100 text-blue-800 border border-blue-200',
    collected: 'bg-green-100 text-green-800 border border-green-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
