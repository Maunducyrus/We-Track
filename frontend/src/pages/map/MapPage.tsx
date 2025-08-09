import React, { useState, useEffect } from 'react';
import { trackingService } from '../../services/trackingService';
import { Device, Vehicle } from '../../types';
import { 
  MapPin, 
  Filter, 
  Layers, 
  Navigation,
  Smartphone,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import TrackingMap from '../../components/map/TrackingMap';

const MapPage: React.FC = () => {
  const [items, setItems] = useState<(Device | Vehicle)[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Device | Vehicle)[]>([]);
  const [selectedItem, setSelectedItem] = useState<Device | Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'found' | 'returned'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'device' | 'vehicle'>('all');
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, statusFilter, typeFilter]);

  const loadItems = () => {
    const allItems = trackingService.getAllItems();
    setItems(allItems);
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => 
        typeFilter === 'device' ? 'type' in item : !('type' in item)
      );
    }

    setFilteredItems(filtered);
  };

  const getItemIcon = (item: Device | Vehicle) => {
    return 'type' in item ? <Smartphone className="w-4 h-4" /> : <Car className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost': return 'text-red-600 bg-red-100';
      case 'found': return 'text-green-600 bg-green-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lost': return <AlertTriangle className="w-3 h-3" />;
      case 'found': return <CheckCircle className="w-3 h-3" />;
      case 'returned': return <CheckCircle className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
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

  const getItemLocation = (item: Device | Vehicle) => {
    return item.currentLocation || item.lastKnownLocation;
  };

  const stats = {
    total: filteredItems.length,
    lost: filteredItems.filter(item => item.status === 'lost').length,
    found: filteredItems.filter(item => item.status === 'found').length,
    returned: filteredItems.filter(item => item.status === 'returned').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Tracking Map</h1>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Layers className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Lost</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">{stats.lost}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Items</option>
                    <option value="device">Devices</option>
                    <option value="vehicle">Vehicles</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No items found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const location = getItemLocation(item);
                    
                    return (
                      <div
                        key={item.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getItemIcon(item)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {getItemTitle(item)}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {getItemSubtitle(item)}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {getStatusIcon(item.status)}
                                <span>{item.status.toUpperCase()}</span>
                              </div>
                              
                              {location && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Navigation className="w-3 h-3" />
                                  <span>Tracked</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative">
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          )}

          <TrackingMap
            selectedItem={selectedItem || undefined}
            showAllItems={!selectedItem && filteredItems.length > 0}
            height="100%"
            onItemSelect={setSelectedItem}
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Lost Items</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Found Items</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-gray-700">Returned Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;