import React, { useState, useEffect } from 'react';
import { trackingService } from '../../services/trackingService';
import { Device, Vehicle } from '../../types';
import { 
  Search, 
  Filter, 
  Smartphone, 
  Car, 
  MapPin, 
  Clock, 
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TrackingMap from '../../components/map/TrackingMap';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'device' | 'vehicle'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'found' | 'returned'>('all');
  const [searchResults, setSearchResults] = useState<(Device | Vehicle)[]>([]);
  const [selectedItem, setSelectedItem] = useState<Device | Vehicle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performSearch();
  }, [searchQuery, searchType, statusFilter]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      let results: (Device | Vehicle)[] = [];
      
      if (searchQuery.trim() === '') {
        // If no search query, show all items
        results = trackingService.getAllItems();
      } else {
        // Search devices and vehicles
        const deviceResults = trackingService.searchDevices(searchQuery);
        const vehicleResults = trackingService.searchVehicles(searchQuery);
        results = [...deviceResults, ...vehicleResults];
      }

      // Apply filters
      if (searchType !== 'all') {
        results = results.filter(item => 
          searchType === 'device' ? 'type' in item : !('type' in item)
        );
      }

      if (statusFilter !== 'all') {
        results = results.filter(item => item.status === statusFilter);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lost': return <AlertTriangle className="w-4 h-4" />;
      case 'found': return <CheckCircle className="w-4 h-4" />;
      case 'returned': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getItemLocation = (item: Device | Vehicle) => {
    return item.currentLocation || item.lastKnownLocation;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Items</h1>
          <p className="text-gray-600">
            Search for lost or found devices and vehicles using IMEI, serial numbers, license plates, or keywords
          </p>
        </div>

        {/* Search Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by IMEI, serial number, license plate, brand, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="device">Devices Only</option>
                <option value="vehicle">Vehicles Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          {/* Search Stats */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {loading ? 'Searching...' : `${searchResults.length} items found`}
            </span>
            {searchQuery && (
              <span>
                Search results for: <strong>"{searchQuery}"</strong>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No items found matching your search criteria</p>
                  <p className="text-sm mt-2">Try adjusting your search terms or filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((item) => {
                    const location = getItemLocation(item);
                    
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
                                {getItemTitle(item)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getItemSubtitle(item)}
                              </p>
                              {location && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                  </p>
                                </div>
                              )}
                              {location && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(location.timestamp, { addSuffix: true })}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span>{item.status.toUpperCase()}</span>
                            </div>
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

          {/* Map and Details */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedItem ? 'Item Location' : 'Search Results Map'}
                </h2>
                {selectedItem && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing: {getItemTitle(selectedItem)}
                  </p>
                )}
              </div>
              <div className="p-6">
                <TrackingMap
                  selectedItem={selectedItem || undefined}
                  showAllItems={!selectedItem && searchResults.length > 0}
                  height="300px"
                  onItemSelect={setSelectedItem}
                />
              </div>
            </div>

            {/* Item Details */}
            {selectedItem && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getItemIcon(selectedItem)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getItemTitle(selectedItem)}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {getItemSubtitle(selectedItem)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className={`mt-1 inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                        {getStatusIcon(selectedItem.status)}
                        <span>{selectedItem.status.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Reported</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDistanceToNow(selectedItem.reportedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {'type' in selectedItem ? (
                    // Device details
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Device Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{(selectedItem as Device).type}</p>
                      </div>
                      
                      {(selectedItem as Device).imei && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">IMEI</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono">{(selectedItem as Device).imei}</p>
                        </div>
                      )}
                      
                      {(selectedItem as Device).phoneNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone Number</label>
                          <p className="mt-1 text-sm text-gray-900">{(selectedItem as Device).phoneNumber}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Vehicle details
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Vehicle Details</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {(selectedItem as Vehicle).year} {(selectedItem as Vehicle).make} {(selectedItem as Vehicle).model}
                        </p>
                      </div>
                      
                      {(selectedItem as Vehicle).chassisNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Chassis Number</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono">{(selectedItem as Vehicle).chassisNumber}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedItem.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedItem.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;