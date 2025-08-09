import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackingService } from '../../services/trackingService';
import { useRealTimeTracking } from '../../hooks/useRealTimeTracking';
import { Device, Vehicle } from '../../types';
import { 
  Smartphone, 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Plus,
  Search,
  Filter,
  Eye,
  Activity,
  Navigation,
  Signal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import TrackingMap from '../../components/map/TrackingMap';
import RealTimeTracker from '../../components/tracking/RealTimeTracker';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedItem, setSelectedItem] = useState<Device | Vehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRealTimeTracker, setShowRealTimeTracker] = useState(false);

  // Real-time tracking for selected item
  const { 
    userLocation, 
    getUserLocation,
    formatDistance,
    getDistanceFromUser 
  } = useRealTimeTracking(selectedItem);

  useEffect(() => {
    loadData();
    getUserLocation(); // Get user location on component mount
  }, []);

  const loadData = () => {
    setDevices(trackingService.getDevices());
    setVehicles(trackingService.getVehicles());
  };

  const allItems = [...devices, ...vehicles];
  const filteredItems = allItems.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = searchQuery === '' || 
      ('type' in item ? 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.imei?.toLowerCase().includes(searchQuery.toLowerCase())
        :
        item.numberPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: allItems.length,
    lost: allItems.filter(item => item.status === 'lost').length,
    found: allItems.filter(item => item.status === 'found').length,
    returned: allItems.filter(item => item.status === 'returned').length,
    tracking: allItems.filter(item => item.isActive && item.status === 'lost').length,
    moving: allItems.filter(item => trackingService.isItemMoving(item.id)).length
  };

  const getItemIcon = (item: Device | Vehicle) => {
    return 'type' in item ? <Smartphone className="w-5 h-5" /> : <Car className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost': return 'text-red-600 bg-red-100';
      case 'found': return 'text-green-600 bg-green-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getItemLocation = (item: Device | Vehicle) => {
    return item.currentLocation || item.lastKnownLocation;
  };

  const getItemDistance = (item: Device | Vehicle) => {
    if (!userLocation) return null;
    const location = getItemLocation(item);
    if (!location) return null;
    return getDistanceFromUser(location);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Track and manage your reported devices and vehicles
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.tracking} actively tracking
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lost</p>
                <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.moving} currently moving
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Found</p>
                <p className="text-2xl font-bold text-green-600">{stats.found}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Awaiting return
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Returned</p>
                <p className="text-2xl font-bold text-gray-600">{stats.returned}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Successfully recovered
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/report/device"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Report Device</span>
            </Link>
            <Link
              to="/report/vehicle"
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Report Vehicle</span>
            </Link>
            <Link
              to="/search"
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search Items</span>
            </Link>
            <Link
              to="/map"
              className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>View Map</span>
            </Link>
            <button
              onClick={() => setShowRealTimeTracker(!showRealTimeTracker)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Real-time Tracker</span>
            </button>
          </div>
        </div>

        {/* Real-time Tracker */}
        {showRealTimeTracker && selectedItem && (
          <div className="mb-8">
            <RealTimeTracker 
              item={selectedItem}
              showControls={true}
              showNearbyItems={true}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Items List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Items</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No items found matching your criteria</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const location = getItemLocation(item);
                    const isDevice = 'type' in item;
                    const distance = getItemDistance(item);
                    const isMoving = trackingService.isItemMoving(item.id);
                    const isTracking = item.isActive && item.status === 'lost';
                    
                    return (
                      <div
                        key={item.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getItemIcon(item)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {isDevice ? (item as Device).name : `${(item as Vehicle).make} ${(item as Vehicle).model}`}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {isTracking && (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-green-600 font-medium">LIVE</span>
                                  </div>
                                )}
                                {isMoving && (
                                  <Activity className="w-4 h-4 text-orange-500" title="Moving" />
                                )}
                                {isDevice ? 
                                  `${(item as Device).brand} • ${(item as Device).serialNumber}` :
                                  `${(item as Vehicle).numberPlate} • ${(item as Vehicle).color}`
                                }
                              </p>
                              {distance !== null && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Navigation className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs text-blue-600 font-medium">
                                    {formatDistance(distance)} away
                                  </span>
                                </div>
                              )}
                              {location && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Last seen: {formatDistanceToNow(location.timestamp, { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                            {location?.accuracy && (
                              <div className="flex items-center space-x-1">
                                <Signal className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  ±{Math.round(location.accuracy)}m
                                </span>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedItem ? 'Item Location' : 'All Items Map'}
              </h2>
              {selectedItem && (
                <p className="text-sm text-gray-600 mt-1">
                  Tracking: {'type' in selectedItem ? selectedItem.name : `${selectedItem.make} ${selectedItem.model}`}
                </p>
              )}
            </div>
            <div className="p-6">
              <TrackingMap
                selectedItem={selectedItem || undefined}
                showAllItems={!selectedItem}
                height="400px"
                onItemSelect={setSelectedItem}
                userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
                showUserLocation={true}
                showDistances={true}
                realTimeUpdates={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;