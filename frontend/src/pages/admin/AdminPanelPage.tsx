import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackingService } from '../../services/trackingService';
import { Device, Vehicle } from '../../types';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  Settings,
  Download,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TrackingMap from '../../components/map/TrackingMap';

const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'items' | 'analytics' | 'settings'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'found' | 'returned'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDevices(trackingService.getDevices());
    setVehicles(trackingService.getVehicles());
  };

  const allItems = [...devices, ...vehicles];
  const filteredItems = statusFilter === 'all' ? allItems : allItems.filter(item => item.status === statusFilter);

  const stats = {
    totalItems: allItems.length,
    totalDevices: devices.length,
    totalVehicles: vehicles.length,
    lostItems: allItems.filter(item => item.status === 'lost').length,
    foundItems: allItems.filter(item => item.status === 'found').length,
    returnedItems: allItems.filter(item => item.status === 'returned').length,
    activeTracking: allItems.filter(item => item.isActive).length,
    recoveryRate: allItems.length > 0 ? Math.round((allItems.filter(item => item.status === 'returned').length / allItems.length) * 100) : 0
  };

  const recentItems = allItems
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost': return 'text-red-600 bg-red-100';
      case 'found': return 'text-green-600 bg-green-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getItemTitle = (item: Device | Vehicle) => {
    return 'type' in item ? 
      (item as Device).name : 
      `${(item as Vehicle).make} ${(item as Vehicle).model}`;
  };

  const getItemSubtitle = (item: Device | Vehicle) => {
    return 'type' in item ? 
      `${(item as Device).brand} • ${(item as Device).serialNumber}` :
      `${(item as Vehicle).numberPlate} • ${(item as Vehicle).color}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'items', label: 'Items', icon: MapPin },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">System overview and management dashboard</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  selectedTab === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>{stats.totalDevices} devices, {stats.totalVehicles} vehicles</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lost Items</p>
                    <p className="text-2xl font-bold text-red-600">{stats.lostItems}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>Active cases requiring attention</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recovery Rate</p>
                    <p className="text-2xl font-bold text-green-600">{stats.recoveryRate}%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>{stats.returnedItems} items successfully returned</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tracking</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.activeTracking}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>Items with real-time tracking</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {recentItems.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent reports</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentItems.map((item) => (
                        <div key={item.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {getItemTitle(item)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getItemSubtitle(item)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Reported {formatDistanceToNow(item.reportedAt, { addSuffix: true })}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Map Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Items Overview Map</h2>
                </div>
                <div className="p-6">
                  <TrackingMap
                    showAllItems={true}
                    height="300px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {selectedTab === 'items' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Items</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                    <option value="returned">Returned</option>
                  </select>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reported
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const location = item.currentLocation || item.lastKnownLocation;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {getItemTitle(item)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {getItemSubtitle(item)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 capitalize">
                              {'type' in item ? (item as Device).type : 'Vehicle'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDistanceToNow(item.reportedAt, { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location ? (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                </span>
                              </div>
                            ) : (
                              'No location'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              View
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Device Types</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-800">Phones</span>
                      <span className="font-medium text-blue-900">
                        {devices.filter(d => d.type === 'phone').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">Laptops</span>
                      <span className="font-medium text-blue-900">
                        {devices.filter(d => d.type === 'laptop').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">Tablets</span>
                      <span className="font-medium text-blue-900">
                        {devices.filter(d => d.type === 'tablet').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Recovery Trends</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-800">This Week</span>
                      <span className="font-medium text-green-900">
                        {Math.floor(stats.returnedItems * 0.3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-800">This Month</span>
                      <span className="font-medium text-green-900">
                        {stats.returnedItems}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-800">Success Rate</span>
                      <span className="font-medium text-green-900">
                        {stats.recoveryRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">System Health</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-800">Active Tracking</span>
                      <span className="font-medium text-purple-900">
                        {stats.activeTracking}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800">Response Time</span>
                      <span className="font-medium text-purple-900">
                        2.3 min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800">Uptime</span>
                      <span className="font-medium text-purple-900">
                        99.9%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notification Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Email notifications for new reports</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">SMS alerts for high-priority cases</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Daily summary reports</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tracking Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Update Interval
                      </label>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>30 seconds</option>
                        <option>1 minute</option>
                        <option>5 minutes</option>
                        <option>15 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Retention Period
                      </label>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>1 year</option>
                        <option>Indefinite</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelPage;