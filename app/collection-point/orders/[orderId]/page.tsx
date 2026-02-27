'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2, Package, ArrowLeft, CheckCircle2, Minus, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '../../../../components/UserContext';
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
    } catch {
      toast.error('Failed to update order status. Please try again.');
    }
  };

  const allComplete =
    order.status === 'confirmed' &&
    order.items.length > 0 &&
    order.items.every((_: any, i: number) => (packedQty.get(i) ?? 0) >= order.items[i].quantity);

  const packedCount = order.items.filter(
    (_: any, i: number) => (packedQty.get(i) ?? 0) >= order.items[i].quantity
  ).length;

  const initials = order.username
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = (() => {
    const diff = Date.now() - order.createdAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="min-h-screen bg-gray-50 pb-36 sm:pb-28">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/collection-point')}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors -ml-1 flex-shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-gray-900 truncate">
          Order #{order.orderId.split('-')[1]}
        </h1>
        <span className={`px-3 py-1 text-sm font-bold rounded-full flex-shrink-0 ${getStatusBadge(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Customer info strip */}
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-700">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.username}</p>
            <p className="text-xs text-gray-500 truncate">{order.collectionPoint}</p>
          </div>
          <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</p>
        </div>

        {/* All-packed success banner */}
        {order.status === 'confirmed' && allComplete && (
          <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3 mb-4 animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">All items packed!</p>
              <p className="text-xs text-green-600">Tap "Mark as Packed" below to confirm.</p>
            </div>
          </div>
        )}

        {/* Item cards */}
        <div className="space-y-3">
          {order.items.map((item: any, index: number) => {
            const packed = packedQty.get(index) ?? 0;
            const total = item.quantity;
            const isComplete = packed >= total;
            const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all duration-200 ${
                  isComplete ? 'border-green-300' : 'border-transparent'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product image */}
                    <div
                      className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-zoom-in"
                      onClick={() =>
                        PRODUCT_IMAGES[item.itemId] &&
                        setZoomedImage({ src: PRODUCT_IMAGES[item.itemId], alt: item.itemName })
                      }
                    >
                      {PRODUCT_IMAGES[item.itemId] ? (
                        <img
                          src={PRODUCT_IMAGES[item.itemId]}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Name + ID + complete badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-base font-bold leading-tight ${isComplete ? 'text-green-700' : 'text-gray-900'}`}>
                            {item.itemName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.itemId}</p>
                        </div>
                        {isComplete && (
                          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      {order.status !== 'confirmed' && (
                        <p className="text-sm font-semibold text-gray-600 mt-2">Qty: {total}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress + stepper — confirmed only */}
                  {order.status === 'confirmed' && (
                    <div className="mt-4">
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            pct === 0
                              ? 'bg-transparent'
                              : pct <= 33
                              ? 'bg-red-400'
                              : pct <= 66
                              ? 'bg-orange-400'
                              : pct < 100
                              ? 'bg-yellow-400'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Stepper row */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-medium">{pct}% packed</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updatePackedQty(index, -1, total)}
                            disabled={packed === 0}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Decrease packed quantity"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <div className="flex items-center gap-1.5 justify-center">
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
                                  if (next) { next.focus(); next.select(); }
                                }
                              }}
                              className="w-11 text-center text-base font-bold text-gray-900 border-2 border-gray-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                            <span className="text-sm font-semibold text-gray-400">/ {total}</span>
                          </div>
                          <button
                            onClick={() => updatePackedQty(index, 1, total)}
                            disabled={packed >= total}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Increase packed quantity"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky footer action bar */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto">
          {order.status === 'confirmed' && (
            <div className="flex flex-col gap-2">
              {!allComplete && (
                <p className="text-center text-sm text-gray-400">
                  {packedCount} of {order.items.length} items packed
                </p>
              )}
              <button
                onClick={() => handleStatusChange('packed')}
                disabled={!allComplete}
                className={`w-full py-4 rounded-xl text-base font-bold transition-all ${
                  allComplete
                    ? 'bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {allComplete ? 'Mark as Packed ✓' : 'Mark as Packed'}
              </button>
            </div>
          )}

          {order.status === 'packed' && (
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusChange('confirmed')}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-xl text-sm font-semibold transition-all"
              >
                Move Back
              </button>
              <button
                onClick={() => handleStatusChange('collected')}
                className="flex-[2] py-4 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white rounded-xl text-base font-bold transition-all shadow-sm"
              >
                Mark Collected
              </button>
            </div>
          )}

          {order.status === 'collected' && (
            <div className="flex items-center justify-center gap-2 py-3.5 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold text-green-700">Order has been collected</span>
            </div>
          )}
        </div>
      </div>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-lg w-full animate-fade-in-scale"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              className="w-full h-auto rounded-2xl shadow-2xl object-cover"
            />
            <p className="text-white text-base font-semibold text-center mt-4">{zoomedImage.alt}</p>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    confirmed: 'bg-yellow-100 text-yellow-800',
    packed: 'bg-blue-100 text-blue-800',
    collected: 'bg-green-100 text-green-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
}
