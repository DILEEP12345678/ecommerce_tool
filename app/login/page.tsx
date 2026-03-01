'use client';

import { useQuery } from 'convex/react';
import { Loader2, MapPin, User, Shield, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSetUser, useUser, useUserLoaded } from '../../components/UserContext';
import { api } from '../../convex/_generated/api';

export default function LoginPage() {
  const router = useRouter();
  const user = useUser();
  const loaded = useUserLoaded();
  const setUser = useSetUser();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState('');
  const [showCollectionPointSelection, setShowCollectionPointSelection] = useState(false);

  const collectionPoints = useQuery(api.users.getCollectionPoints);

  // Redirect if already logged in
  useEffect(() => {
    if (!loaded) return;
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'collection_point_manager') {
        router.push('/collection-point');
      } else {
        router.push('/store');
      }
    }
  }, [user, router, loaded]);

  const testUsers = [
    {
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin' as const,
    },
    {
      email: 'customer1@test.com',
      name: 'Customer One',
      role: 'customer' as const,
    },
    {
      email: 'customer2@test.com',
      name: 'Customer Two',
      role: 'customer' as const,
    },
    {
      email: 'customer3@test.com',
      name: 'Customer Three',
      role: 'customer' as const,
    },
    {
      email: 'cp.north@test.com',
      name: 'North Point Manager',
      role: 'collection_point_manager' as const,
      collectionPoint: 'North Collection Point',
    },
    {
      email: 'cp.south@test.com',
      name: 'South Point Manager',
      role: 'collection_point_manager' as const,
      collectionPoint: 'South Collection Point',
    },
    {
      email: 'cp.east@test.com',
      name: 'East Point Manager',
      role: 'collection_point_manager' as const,
      collectionPoint: 'East Collection Point',
    },
    {
      email: 'cp.west@test.com',
      name: 'West Point Manager',
      role: 'collection_point_manager' as const,
      collectionPoint: 'West Collection Point',
    },
  ];

  const handleUserSelection = () => {
    if (!selectedUser) {
      toast.error('Please select a user to continue');
      return;
    }

    const userData = testUsers.find((u) => u.email === selectedUser);
    if (userData) {
      if (userData.role === 'admin') {
        setUser(userData);
        router.push('/admin');
      } else if (userData.role === 'collection_point_manager') {
        setUser(userData);
        router.push('/collection-point');
      } else {
        setShowCollectionPointSelection(true);
      }
    }
  };

  const handleLogin = () => {
    if (!selectedCollectionPoint) {
      toast.error('Please select a collection point');
      return;
    }

    const userData = testUsers.find((u) => u.email === selectedUser);
    if (userData) {
      setUser({
        ...userData,
        collectionPoint: selectedCollectionPoint,
      });
      router.push('/store');
    }
  };

  if (showCollectionPointSelection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start sm:items-center justify-center p-4 py-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-5 sm:p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mx-auto mb-6">
            <MapPin className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Choose Your Collection Point
          </h1>
          <p className="text-gray-600 mb-8 text-center text-lg">
            Pick the nearest location for order pickup
          </p>

          {!collectionPoints ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : collectionPoints.length === 0 ? (
            <div className="mb-6 p-5 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-base text-yellow-800 mb-1 font-semibold">
                No collection points available
              </p>
              <p className="text-sm text-yellow-700">
                Please initialize test users first.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {collectionPoints.map((point) => (
                <label
                  key={point}
                  className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedCollectionPoint === point
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="collectionPoint"
                    value={point}
                    checked={selectedCollectionPoint === point}
                    onChange={(e) => setSelectedCollectionPoint(e.target.value)}
                    className="w-5 h-5 accent-primary-500"
                  />
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-5 h-5 flex-shrink-0 ${selectedCollectionPoint === point ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="text-lg font-semibold text-gray-900">{point}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowCollectionPointSelection(false);
                setSelectedCollectionPoint('');
              }}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleLogin}
              disabled={!selectedCollectionPoint}
              className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start sm:items-center justify-center p-4 py-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg p-5 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mx-auto mb-4">
            <Package className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome! Please Log In
          </h1>
          <p className="text-gray-600 text-lg">
            Select your account below to continue
          </p>
        </div>

        {/* Admin Account */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-gray-900">Admin</h2>
          </div>
          <div className="space-y-3">
            {testUsers
              .filter((u) => u.role === 'admin')
              .map((userData) => (
                <label
                  key={userData.email}
                  className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedUser === userData.email
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="user"
                    value={userData.email}
                    checked={selectedUser === userData.email}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-5 h-5 accent-primary-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{userData.name}</p>
                      <p className="text-sm text-gray-500">{userData.email}</p>
                      <p className="text-sm text-primary-600 font-medium mt-0.5">View all orders across collection points</p>
                    </div>
                  </div>
                </label>
              ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-100 mb-7" />

        {/* Accounts — Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Customer Accounts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">Customer Accounts</h2>
            </div>
            <div className="space-y-3">
              {testUsers
                .filter((u) => u.role === 'customer')
                .map((userData) => (
                  <label
                    key={userData.email}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedUser === userData.email
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={userData.email}
                      checked={selectedUser === userData.email}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-5 h-5 accent-primary-500"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">{userData.name}</p>
                        <p className="text-sm text-gray-500">{userData.email}</p>
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Collection Point Manager Accounts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold text-gray-900">Collection Point Managers</h2>
            </div>
            <div className="space-y-3">
              {testUsers
                .filter((u) => u.role === 'collection_point_manager')
                .map((userData) => (
                  <label
                    key={userData.email}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedUser === userData.email
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={userData.email}
                      checked={selectedUser === userData.email}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-5 h-5 accent-primary-500"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">{userData.name}</p>
                        <p className="text-sm text-gray-500">{userData.email}</p>
                        <p className="text-sm text-green-700 font-medium mt-0.5">{userData.collectionPoint}</p>
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleUserSelection}
          className="w-full py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xl transition-colors shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
