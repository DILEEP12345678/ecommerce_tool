'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, Package, User, MapPin, ShoppingCart, Hash, CheckCircle } from 'lucide-react';
import { useCollectionPoint, useUser } from '../../components/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, memo } from 'react';

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
  const [selectedStatus, setSelectedStatus] = useState<string>('confirmed');
  const [checkedOrders, setCheckedOrders] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const orders = useQuery(
    api.orders.getByCollectionPoint,
    collectionPoint ? { collectionPoint } : 'skip'
  );
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

  // Handle packing completion
  const handlePackingCompleted = async () => {
    if (checkedOrders.size === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      // Update status for all checked orders to "packed"
      await Promise.all(
        Array.from(checkedOrders).map(orderId =>
          updateStatus({ orderId, status: 'packed' })
        )
      );

      // Clear checked orders after successful update
      setCheckedOrders(new Set());
      alert(`Successfully marked ${checkedOrders.size} order(s) as packed!`);
    } catch (error) {
      alert('Failed to update orders. Please try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle collection completion
  const handleCollectionCompleted = async () => {
    if (checkedOrders.size === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      // Update status for all checked orders to "collected"
      await Promise.all(
        Array.from(checkedOrders).map(orderId =>
          updateStatus({ orderId, status: 'collected' })
        )
      );

      // Clear checked orders after successful update
      setCheckedOrders(new Set());
      alert(`Successfully marked ${checkedOrders.size} order(s) as collected!`);
    } catch (error) {
      alert('Failed to update orders. Please try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orders) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Filter out cancelled orders from all views
  const activeOrders = orders.filter((order: any) => order.status !== 'cancelled');

  const filteredOrders = activeOrders.filter((order: any) => order.status === selectedStatus);

  // Calculate product and quantity stats (exclude cancelled orders)
  const uniqueProducts = new Set<string>();
  const confirmedItems = new Map<string, { itemId: string; itemName: string; quantity: number }>();

  activeOrders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      uniqueProducts.add(item.itemId);
    });

    // Aggregate confirmed order items
    if (order.status === 'confirmed') {
      order.items.forEach((item: any) => {
        const existing = confirmedItems.get(item.itemId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          confirmedItems.set(item.itemId, {
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
          });
        }
      });
    }
  });

  const stats = {
    total: activeOrders.length,
    confirmed: activeOrders.filter((o: any) => o.status === 'confirmed').length,
    packed: activeOrders.filter((o: any) => o.status === 'packed').length,
    collected: activeOrders.filter((o: any) => o.status === 'collected').length,
  };

  // Convert confirmed items map to sorted array
  const confirmedItemsList = Array.from(confirmedItems.values()).sort((a, b) =>
    a.itemName.localeCompare(b.itemName)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">{collectionPoint}</h1>
      </div>

      {/* Confirmed Items to Pack */}
      {confirmedItemsList.length > 0 && (
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
                {confirmedItemsList.map((item) => (
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
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedStatus('confirmed')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'confirmed'
                ? 'bg-yellow-600 border-yellow-700 shadow-md'
                : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 hover:shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${selectedStatus === 'confirmed' ? 'text-yellow-100' : 'text-yellow-700'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'confirmed' ? 'text-yellow-100' : 'text-yellow-700'}`}>Confirmed</p>
              <p className={`text-lg font-bold ${selectedStatus === 'confirmed' ? 'text-white' : 'text-yellow-800'}`}>{stats.confirmed}</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('packed')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedStatus === 'packed'
                ? 'bg-blue-600 border-blue-700 shadow-md'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${selectedStatus === 'packed' ? 'text-blue-100' : 'text-blue-700'}`} />
            <div>
              <p className={`text-xs ${selectedStatus === 'packed' ? 'text-blue-100' : 'text-blue-700'}`}>Packed</p>
              <p className={`text-lg font-bold ${selectedStatus === 'packed' ? 'text-white' : 'text-blue-800'}`}>{stats.packed}</p>
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
              <OrderCard
                key={order.orderId}
                order={order}
                router={router}
                isChecked={checkedOrders.has(order.orderId)}
                onToggleCheck={(orderId: string) => {
                  setCheckedOrders(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(orderId)) {
                      newSet.delete(orderId);
                    } else {
                      newSet.add(orderId);
                    }
                    return newSet;
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons - Fixed at bottom center - Hide for collected orders view */}
      {(() => {
        // Don't show any buttons when viewing collected orders
        if (selectedStatus === 'collected') {
          return null;
        }

        // Get the actual order IDs from filtered orders for each status
        const packedOrderIds = filteredOrders
          .filter((order: any) => order.status === 'packed')
          .map((order: any) => order.orderId);

        const confirmedOrderIds = filteredOrders
          .filter((order: any) => order.status === 'confirmed')
          .map((order: any) => order.orderId);

        // Check if any checked orders are actually packed orders
        const hasCheckedPackedOrders = Array.from(checkedOrders).some(orderId =>
          packedOrderIds.includes(orderId)
        );

        const hasCheckedOrders = checkedOrders.size > 0;
        const allOrdersChecked = filteredOrders.length > 0 && checkedOrders.size === filteredOrders.length;

        // Show "Collected" button ONLY if there are checked orders that are actually packed
        if (hasCheckedPackedOrders && hasCheckedOrders) {
          return (
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
          );
        }

        // Show "Packing Completed" button if all confirmed orders are checked (no packed orders checked)
        if (!hasCheckedPackedOrders && allOrdersChecked) {
          return (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40">
              <div className="max-w-7xl mx-auto flex justify-center">
                <button
                  onClick={handlePackingCompleted}
                  disabled={isProcessing}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {isProcessing
                    ? 'Processing...'
                    : `Packing Completed (${checkedOrders.size} order${checkedOrders.size > 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          );
        }

        return null;
      })()}
    </div>
  );
}

// Memoized OrderCard component for better performance
const OrderCard = memo(({ order, router, isChecked, onToggleCheck }: {
  order: any;
  router: any;
  isChecked: boolean;
  onToggleCheck: (orderId: string) => void;
}) => {
  const isCollected = order.status === 'collected';

  return (
    <div
      className={`bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all flex flex-col relative ${
        isChecked ? 'opacity-40' : ''
      }`}
    >
      {/* Checkbox - Hide for collected orders */}
      {!isCollected && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(order.orderId);
          }}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}}
            className="w-5 h-5 cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* Order Card Content */}
      <div
        onClick={() => router.push(`/collection-point/orders/${order.orderId}`)}
        className="cursor-pointer"
      >
                {/* Compact Order Header */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-semibold text-gray-900 ${!isCollected ? 'ml-6' : ''}`}>
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
                      {/* Product Image */}
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
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      <span className="font-semibold text-gray-900">×{order.items[0].quantity}</span>
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
