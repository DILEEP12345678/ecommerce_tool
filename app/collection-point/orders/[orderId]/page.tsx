'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ArrowLeft, Clock, CheckCircle2, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import { useCollectionPoint, useUser } from '../../../../components/UserContext';
import { useEffect, useRef, useState } from 'react';

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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useUser();
  const collectionPoint = useCollectionPoint();
  const orderId = params.orderId as string;
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [packedQty, setPackedQty] = useState<Map<number, number>>(() => {
    if (typeof window === 'undefined') return new Map();
    try {
      const saved = localStorage.getItem(`packed-items-${params.orderId}`);
      if (!saved) return new Map();
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
        localStorage.removeItem(`packed-items-${params.orderId}`);
        return new Map();
      }
      return new Map<number, number>(parsed);
    } catch {
      return new Map();
    }
  });

  useEffect(() => {
    if (!orderId) return;
    localStorage.setItem(`packed-items-${orderId}`, JSON.stringify(Array.from(packedQty.entries())));
  }, [packedQty, orderId]);

  const updatePackedQty = (index: number, delta: number, maxQty: number) => {
    setPackedQty(prev => {
      const next = new Map(prev);
      const current = next.get(index) ?? 0;
      const updated = Math.min(maxQty, Math.max(0, current + delta));
      next.set(index, updated);
      return next;
    });
  };

  const order = useQuery(
    api.orders.getByOrderId,
    orderId ? { orderId } : 'skip'
  );
  const updateStatus = useMutation(api.orders.updateStatus);

  useEffect(() => {
    if (!user || user.role !== 'collection_point_manager') {
      router.push('/login');
    }
  }, [user, router]);

  if (order === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg">Order not found</p>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        orderId: order.orderId,
        status: newStatus as any,
      });
      if (newStatus === 'packed') {
        localStorage.removeItem(`packed-items-${order.orderId}`);
        setPackedQty(new Map());
      }
    } catch (error) {
      toast.error('Failed to update order status. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-24 sm:pb-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/collection-point')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors py-2"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-base font-semibold">Back to Dashboard</span>
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Order #{order.orderId.split('-')[1]}
            </h1>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-base text-gray-700">Customer: <strong>{order.username}</strong></span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-base text-gray-700">Collection Point: <strong>{order.collectionPoint}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-base text-gray-500">
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
          <span className={`px-4 py-2 text-base font-bold rounded-xl ${getStatusColor(order.status)}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
          {order.status === 'confirmed' && (() => {
            const doneCount = order.items.filter((_: any, i: number) =>
              (packedQty.get(i) ?? 0) >= order.items[i].quantity
            ).length;
            return (
              <span className="text-base font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                {doneCount}/{order.items.length} packed
              </span>
            );
          })()}
        </div>
        <div className="space-y-4">
          {order.items.map((item: any, index: number) => {
            const packed = packedQty.get(index) ?? 0;
            const total = item.quantity;
            const isComplete = packed >= total;
            const pct = Math.round((packed / total) * 100);

            return (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  isComplete
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                {/* Top row: image + name + done icon */}
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 cursor-zoom-in"
                    onClick={() => PRODUCT_IMAGES[item.itemId] && setZoomedImage({ src: PRODUCT_IMAGES[item.itemId], alt: item.itemName })}
                  >
                    {PRODUCT_IMAGES[item.itemId] ? (
                      <img
                        src={PRODUCT_IMAGES[item.itemId]}
                        alt={item.itemName}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-7 h-7 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-base font-bold ${isComplete ? 'text-green-700' : 'text-gray-900'}`}>
                      {item.itemName}
                    </span>
                    <p className="text-sm text-gray-500">{item.itemId}</p>
                  </div>
                  {isComplete && (
                    <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Progress bar + controls */}
                {order.status === 'confirmed' && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          pct === 0 ? 'bg-transparent' :
                          pct <= 33 ? 'bg-red-500' :
                          pct <= 66 ? 'bg-orange-500' :
                          pct < 100 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-medium">{pct}% packed</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updatePackedQty(index, -1, total)}
                          disabled={packed === 0}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease packed quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={total}
                            value={packed}
                            ref={el => { inputRefs.current[index] = el; }}
                            onChange={e => {
                              const val = Math.min(total, Math.max(0, Number(e.target.value)));
                              setPackedQty(prev => {
                                const next = new Map(prev);
                                next.set(index, isNaN(val) ? 0 : val);
                                return next;
                              });
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const next = inputRefs.current[index + 1];
                                if (next) {
                                  next.focus();
                                  next.select();
                                }
                              }
                            }}
                            className="w-14 text-center text-base font-bold text-gray-900 border-2 border-gray-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                          />
                          <span className="text-base font-semibold text-gray-500">/ {total}</span>
                        </div>
                        <button
                          onClick={() => updatePackedQty(index, 1, total)}
                          disabled={packed >= total}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase packed quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {order.status !== 'confirmed' && (
                  <div className="text-base font-semibold text-gray-600 mt-1">Quantity: {total}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Order Actions</h2>

        {order.status === 'confirmed' && (() => {
          const allComplete = order.items.length > 0 &&
            order.items.every((_: any, i: number) => (packedQty.get(i) ?? 0) >= order.items[i].quantity);
          return (
            <div>
              {!allComplete && (
                <p className="text-base text-gray-500 text-center mb-4 p-3 bg-gray-50 rounded-xl">
                  Pack all items above to mark this order as packed
                </p>
              )}
              <button
                onClick={() => handleStatusChange('packed')}
                disabled={!allComplete}
                className={`w-full py-5 rounded-xl text-lg font-bold transition-colors ${
                  allComplete
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Mark as Packed
              </button>
            </div>
          );
        })()}

        {order.status === 'packed' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleStatusChange('collected')}
              className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-lg font-bold transition-colors"
            >
              Mark as Collected
            </button>
            <button
              onClick={() => handleStatusChange('confirmed')}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-base font-semibold transition-colors"
            >
              Move Back to Confirmed
            </button>
          </div>
        )}

        {order.status === 'collected' && (
          <div className="text-center py-5 bg-green-50 text-green-700 rounded-xl border-2 border-green-200">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-bold">This order has been collected</p>
          </div>
        )}
      </div>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-lg w-full animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              className="w-full h-auto rounded-2xl shadow-2xl object-cover"
            />
            <p className="text-white text-base font-semibold text-center mt-4">{zoomedImage.alt}</p>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-gray-900 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200',
    packed: 'bg-blue-100 text-blue-800 border-2 border-blue-200',
    collected: 'bg-green-100 text-green-800 border-2 border-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
