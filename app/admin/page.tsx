'use client';

import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, Package, User, MapPin, Hash, ShoppingCart, ChevronDown } from 'lucide-react';
import { useUser } from '../../components/UserContext';
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

export default function AdminPage() {
  const router = useRouter();
  const user = useUser();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'confirmed' | 'packed' | 'collected'>('all');
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>('all');

  // Redirect to login if not logged in or not an admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  // ── P0 FIX: paginated orders using smart index routing ──────────────────────
  const { results: orders, status: loadStatus, loadMore } = usePaginatedQuery(
    api.orders.listAllPaginated,
    {
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      collectionPoint: selectedCollectionPoint === 'all' ? undefined : selectedCollectionPoint,
    },
    { initialNumItems: PAGE_SIZE }
  );

  // ── P0 FIX: server-side status counts ──────────────────────────────────────
  const counts = useQuery(api.orders.getStatusCounts, {
    collectionPoint: selectedCollectionPoint === 'all' ? undefined : selectedCollectionPoint,
  });

  // ── P0 FIX: server-side items-to-pack aggregation ──────────────────────────
  const confirmedItemsList = useQuery(api.orders.getConfirmedItemsSummary, {
    collectionPoint: selectedCollectionPoint === 'all' ? undefined : selectedCollectionPoint,
  });

  // Derive unique collection points from loaded orders (grows as user loads more)
  const collectionPoints = Array.from(new Set((orders ?? []).map((o: any) => o.collectionPoint)));

  // Only full-page-spin on the very first load (before counts arrive).
  // Filter switches keep the page visible and show an inline spinner in the grid.
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
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-purple-500" />
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="text-sm text-gray-600">
          Viewing all orders across collection points
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Collection Point
          </label>
          <select
            value={selectedCollectionPoint}
            onChange={(e) => {
              setSelectedCollectionPoint(e.target.value);
              setSelectedStatus('all');
            }}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Collection Points</option>
            {collectionPoints.map((cp) => (
              <option key={cp} value={cp}>{cp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items to Pack — server-side aggregation */}
      {confirmedItemsList === undefined ? (
        <div className="mb-4 flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : confirmedItemsList.length > 0 && (
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">
              Ordered Items ({confirmedItemsList.length} products)
            </h2>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Item ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Item Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Collection Points</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {confirmedItemsList.map((item: any) => (
                  <tr key={item.itemId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-600">{item.itemId}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{item.collectionPoints.join(', ')}</td>
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
      )}

      {/* Orders Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-gray-700" />
          <h2 className="text-sm font-bold text-gray-900">
            Orders {loadStatus === 'CanLoadMore' ? `(${orders.length}+ loaded)` : `(${orders.length})`}
          </h2>
        </div>

        {/* Stats Grid — server-side counts */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { key: 'all',       label: 'Total',     count: stats.total,     icon: Hash,    active: 'bg-gray-800 border-gray-900', inactive: 'bg-white border-gray-200', activeText: 'text-white', inactiveText: 'text-gray-900', activeLabel: 'text-gray-300', inactiveLabel: 'text-gray-500', activeIcon: 'text-white', inactiveIcon: 'text-gray-500' },
            { key: 'confirmed', label: 'Confirmed', count: stats.confirmed, icon: Package, active: 'bg-yellow-600 border-yellow-700', inactive: 'bg-yellow-50 border-yellow-200', activeText: 'text-white', inactiveText: 'text-yellow-800', activeLabel: 'text-yellow-100', inactiveLabel: 'text-yellow-700', activeIcon: 'text-yellow-100', inactiveIcon: 'text-yellow-700' },
            { key: 'packed',    label: 'Packed',    count: stats.packed,    icon: Package, active: 'bg-blue-600 border-blue-700', inactive: 'bg-blue-50 border-blue-200', activeText: 'text-white', inactiveText: 'text-blue-800', activeLabel: 'text-blue-100', inactiveLabel: 'text-blue-700', activeIcon: 'text-blue-100', inactiveIcon: 'text-blue-700' },
            { key: 'collected', label: 'Collected', count: stats.collected, icon: Package, active: 'bg-green-600 border-green-700', inactive: 'bg-green-50 border-green-200', activeText: 'text-white', inactiveText: 'text-green-800', activeLabel: 'text-green-100', inactiveLabel: 'text-green-700', activeIcon: 'text-green-100', inactiveIcon: 'text-green-700' },
          ].map(({ key, label, count, icon: Icon, active, inactive, activeText, inactiveText, activeLabel, inactiveLabel, activeIcon, inactiveIcon }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedStatus === key ? active : inactive} hover:shadow-sm`}
            >
              <Icon className={`w-4 h-4 ${selectedStatus === key ? activeIcon : inactiveIcon}`} />
              <div>
                <p className={`text-xs ${selectedStatus === key ? activeLabel : inactiveLabel}`}>{label}</p>
                <p className={`text-lg font-bold ${selectedStatus === key ? activeText : inactiveText}`}>{count}</p>
              </div>
            </button>
          ))}
        </div>

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
                <OrderCard key={order.orderId} order={order} router={router} />
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
    </div>
  );
}

// Memoized OrderCard component for better performance
const OrderCard = memo(({ order, router }: { order: any; router: any }) => {
  return (
    <div
      onClick={() => router.push(`/admin/orders/${order.orderId}`)}
      className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-purple-300 transition-all flex flex-col cursor-pointer"
    >
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-900">
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
        <div className="flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-600 truncate font-medium">{order.collectionPoint}</p>
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
                <img src={PRODUCT_IMAGES[order.items[0].itemId]} alt={order.items[0].itemName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-900 truncate">{order.items[0].itemName}</span>
          </div>
          <span className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">×{order.items[0].quantity}</span>
        </div>
        {order.items.length > 1 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-purple-600 font-medium">
              +{order.items.length - 1} more item{order.items.length - 1 !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">Click to view details</p>
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
