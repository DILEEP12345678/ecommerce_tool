'use client';

import { usePaginatedQuery, useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ShoppingCart, CheckCircle, ChevronDown } from 'lucide-react';
import { useCollectionPoint, useUser } from '../../components/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, memo } from 'react';

const PAGE_SIZE = 40;

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

export default function CollectionPointPage() {
  const router = useRouter();
  const user = useUser();
  const collectionPoint = useCollectionPoint();
  const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'packed' | 'collected'>('confirmed');
  const [checkedOrders, setCheckedOrders] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const updateStatus = useMutation(api.orders.updateStatus);

  // Redirect to login if not logged in or not a manager
  useEffect(() => {
    if (!user || user.role !== 'collection_point_manager') {
      router.push('/login');
    }
  }, [user, router]);

  // Clear checked orders when status filter changes
  useEffect(() => {
    setCheckedOrders(new Set());
  }, [selectedStatus]);

  // ── P0 FIX: paginated orders scoped to this collection point + selected status
  // Uses composite index by_collection_point_status — no full scan
  const { results: orders, status: loadStatus, loadMore } = usePaginatedQuery(
    api.orders.listAllPaginated,
    collectionPoint
      ? { collectionPoint, status: selectedStatus }
      : 'skip',
    { initialNumItems: PAGE_SIZE }
  );

  // ── P0 FIX: server-side status counts for this collection point
  const counts = useQuery(
    api.orders.getStatusCounts,
    collectionPoint ? { collectionPoint } : 'skip'
  );

  // ── P0 FIX: server-side items-to-pack aggregation
  const confirmedItemsList = useQuery(
    api.orders.getConfirmedItemsSummary,
    collectionPoint ? { collectionPoint } : 'skip'
  );

  // Handle collection completion
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
      alert(`Successfully marked ${checkedOrders.size} order(s) as collected!`);
    } catch (error) {
      alert('Failed to update orders. Please try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Only full-page-spin before counts arrive. Filter switches stay in-page.
  if (counts === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const isSwitchingFilter = loadStatus === 'LoadingFirstPage';
  const stats = counts ?? { confirmed: 0, packed: 0, collected: 0, total: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">{collectionPoint}</h1>
      </div>

      {/* Items to Pack — server-side aggregation, only when viewing confirmed */}
      {selectedStatus === 'confirmed' && (
        confirmedItemsList === undefined ? (
          <div className="mb-4 flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : confirmedItemsList.length > 0 && (
          <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-bold text-gray-900">
                Items to Pack ({confirmedItemsList.length} products)
              </h2>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Item ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Item Name</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900">Qty Needed</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedItemsList.map((item: any) => (
                    <tr key={item.itemId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-600">{item.itemId}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-2 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-900">
                          {item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Orders Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-gray-700" />
          <h2 className="text-sm font-bold text-gray-900">
            Orders {loadStatus === 'CanLoadMore' ? `(${orders.length}+ loaded)` : `(${orders.length})`}
          </h2>
        </div>

        {/* Stats Grid — server-side counts, clickable filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { key: 'confirmed', label: 'Confirmed', count: stats.confirmed, active: 'bg-yellow-600 border-yellow-700', inactive: 'bg-yellow-50 border-yellow-200', activeText: 'text-white', inactiveText: 'text-yellow-800', activeLabel: 'text-yellow-100', inactiveLabel: 'text-yellow-700' },
            { key: 'packed',    label: 'Packed',    count: stats.packed,    active: 'bg-blue-600 border-blue-700',   inactive: 'bg-blue-50 border-blue-200',   activeText: 'text-white', inactiveText: 'text-blue-800',   activeLabel: 'text-blue-100',   inactiveLabel: 'text-blue-700'   },
            { key: 'collected', label: 'Collected', count: stats.collected, active: 'bg-green-600 border-green-700', inactive: 'bg-green-50 border-green-200', activeText: 'text-white', inactiveText: 'text-green-800', activeLabel: 'text-green-100', inactiveLabel: 'text-green-700' },
          ].map(({ key, label, count, active, inactive, activeText, inactiveText, activeLabel, inactiveLabel }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedStatus === key ? active : inactive} hover:shadow-sm`}
            >
              <Package className={`w-4 h-4 ${selectedStatus === key ? activeLabel : inactiveLabel}`} />
              <div>
                <p className={`text-xs ${selectedStatus === key ? activeLabel : inactiveLabel}`}>{label}</p>
                <p className={`text-lg font-bold ${selectedStatus === key ? activeText : inactiveText}`}>{count}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {isSwitchingFilter ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No orders found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* Load More */}
            {loadStatus === 'CanLoadMore' && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => loadMore(PAGE_SIZE)}
                  className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load more orders
                </button>
              </div>
            )}
            {loadStatus === 'LoadingMore' && (
              <div className="mt-4 flex justify-center">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mark as Collected — fixed bottom bar for packed orders */}
      {selectedStatus === 'packed' && checkedOrders.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40">
          <div className="max-w-7xl mx-auto flex justify-center">
            <button
              onClick={handleCollectionCompleted}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {isProcessing
                ? 'Processing...'
                : `Mark as Collected (${checkedOrders.size} order${checkedOrders.size > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized OrderCard component
const OrderCard = memo(({ order, router, isChecked, onToggleCheck }: {
  order: any;
  router: any;
  isChecked: boolean;
  onToggleCheck: (orderId: string) => void;
}) => {
  const isPacked = order.status === 'packed';

  return (
    <div
      className={`bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all flex flex-col relative ${
        isChecked ? 'opacity-40' : ''
      }`}
    >
      {/* Checkbox — only for packed orders */}
      {isPacked && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => { e.stopPropagation(); onToggleCheck(order.orderId); }}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}}
            className="w-5 h-5 cursor-pointer accent-blue-500"
          />
        </div>
      )}

      <div
        onClick={() => router.push(`/collection-point/orders/${order.orderId}`)}
        className="cursor-pointer"
      >
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-semibold text-gray-900 ${isPacked ? 'ml-6' : ''}`}>
              #{order.orderId.split('-')[1]}
            </p>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <User className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500 truncate">{order.username}</p>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>

        <div className="mb-2 bg-white rounded px-3 py-2">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {PRODUCT_IMAGES[order.items[0].itemId] ? (
                  <img
                    src={PRODUCT_IMAGES[order.items[0].itemId]}
                    alt={order.items[0].itemName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-gray-900 truncate">
                {order.items[0].itemName}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">
              ×{order.items[0].quantity}
            </span>
          </div>
          {order.items.length > 1 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-blue-600 font-medium">
                +{order.items.length - 1} more item{order.items.length - 1 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Click to view details and manage order
          </p>
        </div>
      </div>
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'bg-yellow-100 text-yellow-800',
    packed: 'bg-blue-100 text-blue-800',
    collected: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
