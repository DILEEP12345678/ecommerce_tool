'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ArrowLeft, Clock, CheckCircle2, Minus, Plus } from 'lucide-react';
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
      // Validate it's an array of [number, number] pairs before constructing the Map
      if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
        localStorage.removeItem(`packed-items-${params.orderId}`);
        return new Map();
      }
      return new Map<number, number>(parsed);
    } catch {
      return new Map();
    }
  });

  // Persist packed quantities to localStorage whenever they change
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
      if (newStatus === 'packed') {
        localStorage.removeItem(`packed-items-${order.orderId}`);
        setPackedQty(new Map());
      }
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
          {order.status === 'confirmed' && (() => {
            const doneCount = order.items.filter((_: any, i: number) =>
              (packedQty.get(i) ?? 0) >= order.items[i].quantity
            ).length;
            return (
              <span className="text-xs text-gray-500">
                {doneCount}/{order.items.length} items complete
              </span>
            );
          })()}
        </div>
        <div className="space-y-3">
          {order.items.map((item: any, index: number) => {
            const packed = packedQty.get(index) ?? 0;
            const total = item.quantity;
            const isComplete = packed >= total;
            const pct = Math.round((packed / total) * 100);

            const qtyColor = getQtyColor(total);
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-colors ${
                  isComplete
                    ? 'bg-green-50 border-green-200'
                    : `${qtyColor.bg} ${qtyColor.border}`
                }`}
              >
                {/* Top row: image + name + done icon */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 cursor-zoom-in"
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
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isComplete ? 'text-green-700' : 'text-gray-900'}`}>
                    {item.itemName}
                  </span>
                  {isComplete && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Progress bar */}
                {order.status === 'confirmed' && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          pct === 0 ? 'bg-transparent' :
                          pct <= 33 ? 'bg-red-500' :
                          pct <= 66 ? 'bg-orange-500' :
                          pct < 100 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Bottom row: −/+ controls + count */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{pct}% packed</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updatePackedQty(index, -1, total)}
                          disabled={packed === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex items-center gap-1">
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
                            className="w-12 text-center text-sm font-semibold text-gray-900 border border-gray-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <span className="text-sm text-gray-500">/ {total}</span>
                        </div>
                        <button
                          onClick={() => updatePackedQty(index, 1, total)}
                          disabled={packed >= total}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* For non-confirmed orders, just show quantity */}
                {order.status !== 'confirmed' && (
                  <div className="text-xs text-gray-500 mt-1">Qty: {total}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Actions</h2>

        {order.status === 'confirmed' && (() => {
          const allComplete = order.items.length > 0 &&
            order.items.every((_: any, i: number) => (packedQty.get(i) ?? 0) >= order.items[i].quantity);
          return (
            <div>
              {!allComplete && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Pack all items above to mark this order as packed
                </p>
              )}
              <button
                onClick={() => handleStatusChange('packed')}
                disabled={!allComplete}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  allComplete
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Mark as Packed
              </button>
            </div>
          );
        })()}

        {order.status === 'packed' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange('collected')}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Mark as Collected
            </button>
            <button
              onClick={() => handleStatusChange('confirmed')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Move Back to Confirmed
            </button>
          </div>
        )}

        {order.status === 'collected' && (
          <div className="text-center py-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <p className="text-sm font-semibold">✓ This order has been collected</p>
          </div>
        )}
      </div>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              className="w-full h-auto rounded-xl shadow-2xl object-cover"
            />
            <p className="text-white text-sm font-medium text-center mt-3">{zoomedImage.alt}</p>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-gray-900 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getQtyColor(qty: number): { bg: string; border: string } {
  if (qty <= 1) return { bg: 'bg-gray-50',    border: 'border-gray-200'  };
  if (qty === 2) return { bg: 'bg-blue-50',   border: 'border-blue-200'  };
  if (qty === 3) return { bg: 'bg-purple-50', border: 'border-purple-200'};
  if (qty === 4) return { bg: 'bg-orange-50', border: 'border-orange-200'};
  return               { bg: 'bg-red-50',    border: 'border-red-200'   };
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    packed: 'bg-blue-100 text-blue-800 border border-blue-200',
    collected: 'bg-green-100 text-green-800 border border-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
