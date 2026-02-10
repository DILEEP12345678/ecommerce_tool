'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ShoppingCart, Hash } from 'lucide-react';
import { useCollectionPoint, useUser } from '../../components/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, memo } from 'react';

export default function CollectionPointPage() {
  const router = useRouter();
  const user = useUser();
  const collectionPoint = useCollectionPoint();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const orders = useQuery(
    api.orders.getByCollectionPoint,
    collectionPoint ? { collectionPoint } : 'skip'
  );

  // Redirect to login if not logged in or not a manager
  useEffect(() => {
    if (!user || user.role !== 'collection_point_manager') {
      router.push('/login');
    }
  }, [user, router]);

  if (!orders) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const filteredOrders =
    selectedStatus === 'all'
      ? orders
      : orders.filter((order: any) => order.status === selectedStatus);

  // Calculate product and quantity stats
  const uniqueProducts = new Set<string>();
  const pendingItems = new Map<string, { itemId: string; itemName: string; quantity: number }>();

  orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      uniqueProducts.add(item.itemId);
    });

    // Aggregate pending order items
    if (order.status === 'pending') {
      order.items.forEach((item: any) => {
        const existing = pendingItems.get(item.itemId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          pendingItems.set(item.itemId, {
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
          });
        }
      });
    }
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    ready: orders.filter((o: any) => o.status === 'ready').length,
    collected: orders.filter((o: any) => o.status === 'collected').length,
    cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
  };

  // Convert pending items map to sorted array
  const pendingItemsList = Array.from(pendingItems.values()).sort((a, b) =>
    a.itemName.localeCompare(b.itemName)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">{collectionPoint}</h1>
      </div>

      {/* Pending Items to Prepare */}
      {pendingItemsList.length > 0 && (
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">
              Items to Prepare ({pendingItemsList.length} products)
            </h2>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">
                    Item ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">
                    Item Name
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900">
                    Quantity Needed
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingItemsList.map((item) => (
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
      )}

      {/* Orders Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-gray-700" />
          <h2 className="text-sm font-bold text-gray-900">
            Orders ({filteredOrders.length})
          </h2>
        </div>

        {/* Stats Grid - Clickable Filters */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'all'
                ? 'bg-gray-800 border-gray-900 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <Hash className={`w-4 h-4 ${selectedStatus === 'all' ? 'text-white' : 'text-gray-500'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'all' ? 'text-gray-300' : 'text-gray-500'}`}>Total</p>
              <p className={`text-lg font-bold ${selectedStatus === 'all' ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('pending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'pending'
                ? 'bg-yellow-600 border-yellow-700 shadow-md'
                : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 hover:shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${selectedStatus === 'pending' ? 'text-yellow-100' : 'text-yellow-700'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'pending' ? 'text-yellow-100' : 'text-yellow-700'}`}>Pending</p>
              <p className={`text-lg font-bold ${selectedStatus === 'pending' ? 'text-white' : 'text-yellow-800'}`}>{stats.pending}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('ready')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'ready'
                ? 'bg-blue-600 border-blue-700 shadow-md'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${selectedStatus === 'ready' ? 'text-blue-100' : 'text-blue-700'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'ready' ? 'text-blue-100' : 'text-blue-700'}`}>Ready</p>
              <p className={`text-lg font-bold ${selectedStatus === 'ready' ? 'text-white' : 'text-blue-800'}`}>{stats.ready}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('collected')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'collected'
                ? 'bg-green-600 border-green-700 shadow-md'
                : 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${selectedStatus === 'collected' ? 'text-green-100' : 'text-green-700'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'collected' ? 'text-green-100' : 'text-green-700'}`}>Collected</p>
              <p className={`text-lg font-bold ${selectedStatus === 'collected' ? 'text-white' : 'text-green-800'}`}>{stats.collected}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('cancelled')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'cancelled'
                ? 'bg-red-600 border-red-700 shadow-md'
                : 'bg-red-50 border-red-200 hover:border-red-300 hover:shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${selectedStatus === 'cancelled' ? 'text-red-100' : 'text-red-700'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'cancelled' ? 'text-red-100' : 'text-red-700'}`}>Cancelled</p>
              <p className={`text-lg font-bold ${selectedStatus === 'cancelled' ? 'text-white' : 'text-red-800'}`}>{stats.cancelled}</p>
            </div>
          </button>
        </div>

        {/* Compact Orders Grid - 4 per row */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredOrders.map((order: any) => (
              <OrderCard key={order.orderId} order={order} router={router} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoized OrderCard component for better performance
const OrderCard = memo(({ order, router }: { order: any; router: any }) => {
  return (
    <div
      onClick={() => router.push(`/collection-point/orders/${order.orderId}`)}
      className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all flex flex-col cursor-pointer"
    >
                {/* Compact Order Header */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-900">
                      #{order.orderId.split('-')[1]}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500 truncate">{order.username}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Compact Items */}
                <div className="mb-2 bg-white rounded px-3 py-2">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {order.items[0].itemName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      Qty: <span className="font-semibold text-gray-900">{order.items[0].quantity}</span>
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

                {/* Status indicator only */}
                <div className="mt-auto pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Click to view details and manage order
                  </p>
                </div>
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-blue-100 text-blue-800',
    collected: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
