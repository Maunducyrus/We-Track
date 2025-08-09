import React, { useState, useEffect } from 'react';
import type { Device, Vehicle, Location } from '../../types';
import { useRealTimeTracking } from '../../hooks/useRealTimeTracking';
import { 
  MapPin, 
  Navigation, 
  Battery, 
  Signal, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeTrackerProps {
  item: Device | Vehicle;
  showControls?: boolean;
  showNearbyItems?: boolean;
  onLocationUpdate?: (location: Location) => void;
}

const RealTimeTracker: React.FC<RealTimeTrackerProps> = ({
  item,
  showControls = true,
  showNearbyItems = true,
  onLocationUpdate
}) => {
  const [trackingSettings, setTrackingSettings] = useState({
    enableGPS: true,
    trackingInterval: 5000,
    distanceFilter: 10,
    enableBatteryOptimization: true
  });

  const {
    isTracking,
    currentLocation,
    accuracy,
    lastUpdate,
    error,
    batteryLevel,
    nearbyItems,
    userLocation,
    startTracking,
    stopTracking,
    getUserLocation,
    getDistanceFromUser,
    formatDistance,
    getAccuracyDescription,
    isGPSSupported
  } = useRealTimeTracking(item, trackingSettings);

  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate(currentLocation);
    }
  }, [currentLocation, onLocationUpdate]);

  const distanceFromUser = currentLocation && userLocation ? 
    getDistanceFromUser(currentLocation) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost': return 'text-red-600 bg-red-100';
      case 'found': return 'text-green-600 bg-green-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSignalStrength = (accuracy: number) => {
    if (accuracy <= 5) return { strength: 'excellent', color: 'text-green-600', bars: 4 };
    if (accuracy <= 10) return { strength: 'good', color: 'text-blue-600', bars: 3 };
    if (accuracy <= 50) return { strength: 'fair', color: 'text-yellow-600', bars: 2 };
    return { strength: 'poor', color: 'text-red-600', bars: 1 };
  };

  const signal = getSignalStrength(accuracy);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {'type' in item ? (
              <MapPin className="w-5 h-5 text-blue-600" />
            ) : (
              <Navigation className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {'type' in item ? item.name : `${item.make} ${item.model}`}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status.toUpperCase()}
              </span>
              {isTracking && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center space-x-2">
            {isTracking ? (
              <button
                onClick={stopTracking}
                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={startTracking}
                disabled={!isGPSSupported}
                className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Location Info */}
      {currentLocation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Location</span>
              <div className="flex items-center space-x-1">
                <Signal className={`w-4 h-4 ${signal.color}`} />
                <span className="text-xs text-gray-500">{signal.strength}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-900">
              <div>{currentLocation.address || 'Unknown Address'}</div>
              <div className="text-xs text-gray-500 font-mono">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {lastUpdate ? formatDistanceToNow(lastUpdate, { addSuffix: true }) : 'Never'}
                </span>
              </div>
              
              <div>
                Accuracy: ±{Math.round(accuracy)}m
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {distanceFromUser !== null && (
              <div>
                <span className="text-sm text-gray-600">Distance from You</span>
                <div className="text-lg font-semibold text-blue-600">
                  {formatDistance(distanceFromUser)}
                </div>
              </div>
            )}

            {batteryLevel !== undefined && (
              <div className="flex items-center space-x-2">
                <Battery className={`w-4 h-4 ${batteryLevel > 20 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm text-gray-600">
                  Battery: {batteryLevel}%
                </span>
              </div>
            )}

            <button
              onClick={getUserLocation}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Update My Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Nearby Items */}
      {showNearbyItems && nearbyItems.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Nearby Items ({nearbyItems.length})
          </h4>
          <div className="space-y-2">
            {nearbyItems.slice(0, 3).map((nearbyItem) => {
              const nearbyLocation = nearbyItem.currentLocation || nearbyItem.lastKnownLocation;
              const distance = currentLocation && nearbyLocation ? 
                getDistanceFromUser(nearbyLocation) : null;

              return (
                <div key={nearbyItem.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {'type' in nearbyItem ? (
                      <MapPin className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Navigation className="w-4 h-4 text-gray-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {'type' in nearbyItem ? nearbyItem.name : `${nearbyItem.make} ${nearbyItem.model}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {nearbyItem.status}
                      </div>
                    </div>
                  </div>
                  {distance && (
                    <div className="text-sm text-gray-600">
                      {formatDistance(distance)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GPS Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3" />
            <span>
              {isGPSSupported ? 'GPS Available' : 'GPS Not Supported'}
            </span>
          </div>
          
          {isTracking && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time tracking active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTracker;