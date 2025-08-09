import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { trackingService } from '../../services/trackingService';
import { Device, Location } from '../../types';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  MapPin, 
  Camera, 
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const ReportDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'phone' as Device['type'],
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    phoneNumber: '',
    color: '',
    description: '',
    lastKnownAddress: '',
    lastKnownLat: '',
    lastKnownLng: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const deviceTypes = [
    { value: 'phone', label: 'Phone', icon: Smartphone },
    { value: 'laptop', label: 'Laptop', icon: Laptop },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'other', label: 'Other', icon: Smartphone }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Device name is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    
    if (formData.type === 'phone' && !formData.imei.trim()) {
      newErrors.imei = 'IMEI is required for phones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentLocation = () => {
    setUseCurrentLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lastKnownLat: position.coords.latitude.toString(),
            lastKnownLng: position.coords.longitude.toString()
          }));
          setUseCurrentLocation(false);
          addNotification({
            type: 'success',
            title: 'Location captured',
            message: 'Current location has been set as last known location'
          });
        },
        (error) => {
          setUseCurrentLocation(false);
          addNotification({
            type: 'error',
            title: 'Location error',
            message: 'Unable to get current location. Please enter manually.'
          });
        }
      );
    } else {
      setUseCurrentLocation(false);
      addNotification({
        type: 'error',
        title: 'Geolocation not supported',
        message: 'Your browser does not support geolocation'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);

    try {
      let lastKnownLocation: Location | undefined;
      
      if (formData.lastKnownLat && formData.lastKnownLng) {
        lastKnownLocation = {
          id: `loc_${Date.now()}`,
          latitude: parseFloat(formData.lastKnownLat),
          longitude: parseFloat(formData.lastKnownLng),
          address: formData.lastKnownAddress || undefined,
          timestamp: new Date(),
          source: 'manual'
        };
      }

      const device: Omit<Device, 'id' | 'reportedAt'> = {
        name: formData.name,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        imei: formData.imei || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        color: formData.color || undefined,
        description: formData.description || undefined,
        status: 'lost',
        reportedBy: user.id,
        lastKnownLocation,
        isActive: true
      };

      const newDevice = trackingService.addDevice(device);

      addNotification({
        type: 'success',
        title: 'Device reported successfully',
        message: `${device.name} has been added to the tracking system`
      });

      navigate('/dashboard');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Report failed',
        message: 'Unable to report device. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Lost Device</h1>
          <p className="text-gray-600">
            Provide detailed information about your lost device to help with recovery
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Device Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Device Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {deviceTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: value as Device['type'] }))}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      formData.type === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., My iPhone 15 Pro"
                />
                {errors.name && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.brand ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Apple, Samsung, Dell"
                />
                {errors.brand && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.brand}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.model ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., iPhone 15 Pro, Galaxy S24"
                />
                {errors.model && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.model}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Space Black, Silver"
                />
              </div>
            </div>

            {/* Identification Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number *
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.serialNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Device serial number"
                />
                {errors.serialNumber && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.serialNumber}</span>
                  </div>
                )}
              </div>

              {formData.type === 'phone' && (
                <div>
                  <label htmlFor="imei" className="block text-sm font-medium text-gray-700 mb-2">
                    IMEI Number *
                  </label>
                  <input
                    type="text"
                    id="imei"
                    name="imei"
                    value={formData.imei}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.imei ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="15-digit IMEI number"
                  />
                  {errors.imei && (
                    <div className="mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 text-sm">{errors.imei}</span>
                    </div>
                  )}
                </div>
              )}

              {formData.type === 'phone' && (
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any distinctive features, case details, or other identifying information..."
              />
            </div>

            {/* Last Known Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Last Known Location
              </label>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="lastKnownAddress" className="block text-sm text-gray-600 mb-2">
                    Address or Description
                  </label>
                  <input
                    type="text"
                    id="lastKnownAddress"
                    name="lastKnownAddress"
                    value={formData.lastKnownAddress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., University Library, Downtown Mall"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="lastKnownLat" className="block text-sm text-gray-600 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="lastKnownLat"
                      name="lastKnownLat"
                      value={formData.lastKnownLat}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="40.7128"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastKnownLng" className="block text-sm text-gray-600 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="lastKnownLng"
                      name="lastKnownLng"
                      value={formData.lastKnownLng}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="-74.0060"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={useCurrentLocation}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {useCurrentLocation ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span>Use Current</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Report Device</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportDevicePage;