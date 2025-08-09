import React from 'react';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">SecureTrack</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Helping communities recover lost devices and vehicles through advanced tracking technology and collaborative reporting.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/search" className="text-gray-300 hover:text-white transition-colors text-sm">Search Items</a></li>
              <li><a href="/map" className="text-gray-300 hover:text-white transition-colors text-sm">Tracking Map</a></li>
              <li><a href="/public-report" className="text-gray-300 hover:text-white transition-colors text-sm">Report Found</a></li>
              <li><a href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm">Dashboard</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li className="text-gray-300 text-sm">Device Tracking</li>
              <li className="text-gray-300 text-sm">Vehicle Recovery</li>
              <li className="text-gray-300 text-sm">Community Reporting</li>
              <li className="text-gray-300 text-sm">Real-time Alerts</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@securetrack.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4" />
                <span>County Commissioner Office</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 SecureTrack. All rights reserved. Commissioned by County Commissioner.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Help Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;