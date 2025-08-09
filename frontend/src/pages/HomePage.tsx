import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, MapPin, AlertTriangle, Users, BarChart3, Bell, Lock } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Search for lost devices and vehicles using IMEI, serial numbers, or license plates',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: MapPin,
      title: 'Real-time Tracking',
      description: 'Interactive maps showing last known locations and tracking routes',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: AlertTriangle,
      title: 'Quick Reporting',
      description: 'Fast and easy reporting system for lost or found items',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Public reporting system allowing good Samaritans to help',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and heatmaps for theft patterns',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Instant SMS and email alerts when items are located',
      color: 'from-red-500 to-red-600'
    }
  ];

  const stats = [
    { label: 'Items Recovered', value: '1,247', icon: Shield },
    { label: 'Active Cases', value: '89', icon: AlertTriangle },
    { label: 'Community Reports', value: '3,456', icon: Users },
    { label: 'Success Rate', value: '78%', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
              <Lock className="w-4 h-4" />
              <span>County Commissioner Initiative</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Recover Your Lost
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Devices & Vehicles
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              SecureTrack leverages advanced tracking technology and community collaboration to help you recover lost or stolen items quickly and securely.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/search"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Search Now
              </Link>
              <Link
                to="/public-report"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                Report Found Item
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map(({ label, value, icon: Icon }, index) => (
              <div key={label} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
                <p className="text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Recovery
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform combines cutting-edge technology with community collaboration to maximize recovery success rates.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description, color }, index) => (
              <div key={title} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Secure Your Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of users who trust SecureTrack to protect and recover their valuable items.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              to="/map"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
            >
              View Tracking Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;