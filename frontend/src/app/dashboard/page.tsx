'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  userId: number;
  userName: string;
  email: string;
  phoneNumber?: string;
  balance: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <h1 className="text-xl font-bold text-gray-800">TradeUp</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.userName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to TradeUp Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            Your options trading platform with real-time Black-Scholes pricing
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Balance */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-600 font-semibold">Account Balance</span>
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">₹</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-700">
                ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* User Info */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-600 font-semibold">Account Info</span>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👤</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {user.email}
              </p>
              {user.phoneNumber && (
                <p className="text-sm text-gray-700">
                  <strong>Phone:</strong> {user.phoneNumber}
                </p>
              )}
            </div>

            {/* Trading Status */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-600 font-semibold">Trading Status</span>
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> <span className="text-green-600">Active</span>
              </p>
              <p className="text-sm text-gray-700">
                <strong>Market:</strong> <span className="text-green-600">Open</span>
              </p>
            </div>
          </div>
        </div>

        {/* Options Trading Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Options Trading</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NIFTY Options */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4">NIFTY Options</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">ATM Call</span>
                  <span className="text-green-600 font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">ATM Put</span>
                  <span className="text-red-600 font-semibold">₹0.00</span>
                </div>
              </div>
              <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                View All Strikes
              </button>
            </div>

            {/* Quick Actions */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition">
                  Place Order
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition">
                  View Positions
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition">
                  Order History
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
