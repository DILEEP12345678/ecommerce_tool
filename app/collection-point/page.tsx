'use client';

import { usePaginatedQuery, useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Loader2, Package, User, MapPin, ShoppingCart,
  CheckCircle, ChevronDown, ChevronRight, Calendar,
  CheckSquare, Square,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollectionPoint, useUser } from '../../components/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, memo } from 'react';

const PAGE_SIZE = 40;

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

export default function CollectionPointPage() {
  const router = useRouter();
  const user = useUser();
  const collectionPoint = useCollectionPoint();
  const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'packed' | 'collected'>('confirmed');
  const [checkedOrders, setCheckedOrders] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [packListOpen, setPackListOpen] = useState(true);
  const updateStatus = useMutation(api.orders.updateStatus);

  useEffect(() => {
    if (!user || user.role !== 'collection_point_manager') {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    setCheckedOrders(new Set());
  }, [selectedStatus]);

  const { results: orders, status: loadStatus, loadMore } = usePaginatedQuery(
    api.orders.listAllPaginated,
    collectionPoint ? { collectionPoint, status: selectedStatus } : 'skip',
    { initialNumItems: PAGE_SIZE }
  );

  const counts = useQuery(
    api.orders.getStatusCounts,
    collectionPoint ? { collectionPoint } : 'skip'
  );

  const confirmedItemsList = useQuery(
    api.orders.getConfirmedItemsSummary,
    collectionPoint ? { collectionPoint } : 'skip'
  );

  const handleCollectionCompleted = async () => {
    if (checkedOrders.size === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      await Promise.all(
        Array.from(checkedOrders).map(orderId =>
          updateStatus({ orderId, status: 'collected' })
        )
      );
      setCheckedOrders(new Set());
      toast.success(`Marked ${checkedOrders.size} order${checkedOrders.size > 1 ? 's' : ''} as collected!`);
    } catch (error) {
      toast.error('Failed to update orders. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (checkedOrders.size === orders.length) {
      setCheckedOrders(new Set());
    } else {
      setCheckedOrders(new Set(orders.map((o: any) => o.orderId)));
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (counts === undefined) {
    return (
      <div className="pb-24 sm:pb-6">
        {/* Skeleton header */}
        <div className="bg-primary-600 px-4 pt-6 pb-8">
          <div className="h-7 bg-white/20 rounded-lg w-56 mb-2 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-36 animate-pulse" />
        </div>
        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-1 mb-5 animate-pulse h-14" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isSwitchingFilter = loadStatus === 'LoadingFirstPage';
  const stats = counts ?? { confirmed: 0, packed: 0, collected: 0, total: 0 };
  const allSelected = orders.length > 0 && checkedOrders.size === orders.length;

  const tabs = [
    { key: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { key: 'packed',    label: 'Packed',    count: stats.packed    },
    { key: 'collected', label: 'Collected', count: stats.collected },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 sm:pb-6">

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-4 pt-3 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-0.5">
            <MapPin className="w-4 h-4 text-white/80" />
            <h1 className="text-lg font-bold text-white truncate">{collectionPoint}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-white/60" />
            <p className="text-xs text-white/70">{today}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">

        {/* ── STATUS TABS ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-1 mb-3 flex gap-1">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 rounded-xl transition-all text-sm font-semibold ${
                selectedStatus === key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden text-xs font-bold">{label.slice(0, 4)}</span>
              <span className={`text-base sm:text-sm font-bold tabular-nums ${
                selectedStatus === key ? 'text-white' : 'text-gray-800'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── PACK LIST (confirmed tab only) ───────────────── */}
        {selectedStatus === 'confirmed' && confirmedItemsList !== undefined && confirmedItemsList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden">
            <button
              onClick={() => setPackListOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary-500" />
                <span className="font-bold text-gray-900 text-sm">Pack List</span>
                <span className="text-xs bg-primary-100 text-primary-700 font-bold px-2 py-0.5 rounded-full">
                  {confirmedItemsList.length} products
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${packListOpen ? 'rotate-180' : ''}`} />
            </button>

            {packListOpen && (
              <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                {confirmedItemsList.map((item: any) => (
                  <span
                    key={item.itemId}
                    className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-800"
                  >
                    <span className="text-gray-400 text-xs">{item.itemId}</span>
                    {item.itemName}
                    <span className="bg-primary-100 text-primary-700 font-bold text-xs px-1.5 py-0.5 rounded-full">
                      ×{item.quantity}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedStatus === 'confirmed' && confirmedItemsList === undefined && (
          <div className="flex justify-center py-3 mb-4">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {/* ── ORDER LIST HEADER ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-500">
            {isSwitchingFilter ? 'Loading…' : `${loadStatus === 'CanLoadMore' ? `${orders.length}+` : orders.length} orders`}
          </p>
          {selectedStatus === 'packed' && orders.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              {allSelected
                ? <><CheckSquare className="w-4 h-4" /> Deselect All</>
                : <><Square className="w-4 h-4" /> Select All ({orders.length})</>
              }
            </button>
          )}
        </div>

        {/* ── ORDER CARDS ──────────────────────────────────── */}
        {isSwitchingFilter ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm">
            <Package className="w-16 h-16 text-gray-200 mb-3" />
            <p className="text-base font-semibold text-gray-400">No {selectedStatus} orders</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
              {orders.map((order: any) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  router={router}
                  isChecked={checkedOrders.has(order.orderId)}
                  onToggleCheck={(orderId: string) => {
                    setCheckedOrders(prev => {
                      const next = new Set(prev);
                      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
                      return next;
                    });
                  }}
                />
              ))}
            </div>

            {loadStatus === 'CanLoadMore' && (
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => loadMore(PAGE_SIZE)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all shadow-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load more
                </button>
              </div>
            )}
            {loadStatus === 'LoadingMore' && (
              <div className="mt-5 flex justify-center">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MARK AS COLLECTED CTA ────────────────────────── */}
      {selectedStatus === 'packed' && checkedOrders.size > 0 && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 animate-slide-up">
          <div className="bg-white border-t border-gray-100 shadow-2xl px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={handleCollectionCompleted}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg text-white transition-all ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-lg'
                }`}
              >
                <CheckCircle className="w-6 h-6" />
                {isProcessing
                  ? 'Processing…'
                  : `Mark ${checkedOrders.size} Order${checkedOrders.size > 1 ? 's' : ''} as Collected`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ORDER CARD ───────────────────────────────────────────
const OrderCard = memo(({ order, router, isChecked, onToggleCheck }: {
  order: any;
  router: any;
  isChecked: boolean;
  onToggleCheck: (orderId: string) => void;
}) => {
  const isPacked = order.status === 'packed';
  const previewItems = order.items.slice(0, 3);
  const extraCount = order.items.length - previewItems.length;

  const timeAgo = (() => {
    const diff = Date.now() - order.createdAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-all ${
        isChecked
          ? 'border-green-300 bg-green-50 shadow-md'
          : 'border-transparent hover:shadow-md'
      }`}
    >
      <div className="p-4">
        {/* Row 1: order # + customer + time */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-gray-900">
                #{order.orderId.split('-')[1]}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusPill(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium truncate">{order.username}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">· {timeAgo}</span>
            </div>
          </div>

          {/* Packed checkbox — large, right-aligned */}
          {isPacked && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCheck(order.orderId); }}
              className="ml-3 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border-2 transition-all"
              style={{ borderColor: isChecked ? '#22c55e' : '#d1d5db', background: isChecked ? '#dcfce7' : 'white' }}
            >
              {isChecked
                ? <CheckSquare className="w-5 h-5 text-green-600" />
                : <Square className="w-5 h-5 text-gray-400" />
              }
            </button>
          )}
        </div>

        {/* Row 2: product image strip */}
        <button
          onClick={() => router.push(`/collection-point/orders/${order.orderId}`)}
          className="w-full text-left"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {previewItems.map((item: any, i: number) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {PRODUCT_IMAGES[item.itemId] ? (
                    <img
                      src={PRODUCT_IMAGES[item.itemId]}
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {order.items[0].itemName}
                {order.items[0].quantity > 1 && (
                  <span className="text-gray-400 font-normal"> ×{order.items[0].quantity}</span>
                )}
              </p>
              {extraCount > 0 && (
                <p className="text-xs text-primary-600 font-semibold">+{extraCount} more item{extraCount > 1 ? 's' : ''}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </div>
        </button>
      </div>
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

function getStatusPill(status: string) {
  const map: Record<string, string> = {
    confirmed: 'bg-amber-100 text-amber-700',
    packed:    'bg-blue-100 text-blue-700',
    collected: 'bg-green-100 text-green-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}
