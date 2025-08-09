import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { trackingService } from '../../services/trackingService';
import { Vehicle, Location } from '../../types';
import { 
  Car, 
  MapPin, 
  Camera, 
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const ReportVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    numberPlate: '',
    make: '',
    model: '',
    year: '',
    color: '',
    chassisNumber: '',
    engineNumber: '',
    description: '',
    lastKnownAddress: '',
    lastKnownLat: '',
    lastKnownLng: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numberPlate.trim()) newErrors.numberPlate = 'Number plate is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';
    
    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1)) {
      newErrors.year = 'Please enter a valid year';
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

      const vehicle: Omit<Vehicle, 'id' | 'reportedAt'> = {
        numberPlate: formData.numberPlate.toUpperCase(),
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        color: formData.color,
        chassisNumber: formData.chassisNumber || undefined,
        engineNumber: formData.engineNumber || undefined,
        description: formData.description || undefined,
        status: 'lost',
        reportedBy: user.id,
        lastKnownLocation,
        isActive: true
      };

      const newVehicle = trackingService.addVehicle(vehicle);

      addNotification({
        type: 'success',
        title: 'Vehicle reported successfully',
        message: `${vehicle.make} ${vehicle.model} (${vehicle.numberPlate}) has been added to the tracking system`
      });

      navigate('/dashboard');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Report failed',
        message: 'Unable to report vehicle. Please try again.'
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Lost Vehicle</h1>
          <p className="text-gray-600">
            Provide detailed information about your lost vehicle to help with recovery
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Vehicle Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-xl">
                <Car className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numberPlate" className="block text-sm font-medium text-gray-700 mb-2">
                  Number Plate *
                </label>
                <input
                  type="text"
                  id="numberPlate"
                  name="numberPlate"
                  value={formData.numberPlate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.numberPlate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., ABC-123"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.numberPlate && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.numberPlate}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.make ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Toyota, Honda, Ford"
                />
                {errors.make && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.make}</span>
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
                  placeholder="e.g., Camry, Civic, F-150"
                />
                {errors.model && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.model}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.year ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2022"
                />
                {errors.year && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.year}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.color ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., White, Black, Silver"
                />
                {errors.color && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.color}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Identification Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="chassisNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Chassis Number (VIN)
                </label>
                <input
                  type="text"
                  id="chassisNumber"
                  name="chassisNumber"
                  value={formData.chassisNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="17-character VIN"
                  maxLength={17}
                />
              </div>

              <div>
                <label htmlFor="engineNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Engine Number
                </label>
                <input
                  type="text"
                  id="engineNumber"
                  name="engineNumber"
                  value={formData.engineNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Engine identification number"
                />
              </div>
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
                placeholder="Any distinctive features, modifications, damage, or other identifying information..."
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
                    placeholder="e.g., University Parking Lot, Main Street"
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
                <span>Report Vehicle</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportVehiclePage;