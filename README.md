# We-Track - Advanced Real-time Device & Vehicle Tracking System

A comprehensive tracking platform for lost devices and vehicles with real-time GPS tracking, community reporting, and advanced analytics.

## Features

### Core Functionality
- **Real-time GPS Tracking**: Live location updates with sub-meter accuracy
- **Multi-device Support**: Phones, laptops, tablets, and other devices
- **Vehicle Tracking**: Cars, motorcycles, and other vehicles
- **Community Reporting**: Public reporting system for found items
- **Advanced Search**: Search by IMEI, serial numbers, license plates, mobile numbers
- **Interactive Maps**: Real-time location visualization with movement tracking
- **Distance Calculation**: Real-time distance from your location or any reference point
- **Geofencing**: Alert zones and boundary notifications
- **Route History**: Complete movement history and patterns

### Advanced Features
- **Mobile Integration**: SMS/Call integration for device tracking
- **Battery Monitoring**: Track device battery levels
- **Network Triangulation**: Use cell towers when GPS unavailable
- **Predictive Analytics**: AI-powered location prediction
- **Heat Maps**: Crime and recovery pattern analysis
- **Multi-user Collaboration**: Share tracking with family/team
- **Offline Tracking**: Store locations when offline, sync when connected

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3.4
- **Maps**: Leaflet with real-time updates
- **State Management**: React Context + Hooks
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Geolocation**: HTML5 Geolocation API + GPS integration
- **Real-time**: WebSocket connections for live updates

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with geolocation support
- HTTPS connection (required for geolocation)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Maunducyrus/We-Track
cd We-Track
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_APP_NAME=SecureTrack
VITE_GEOLOCATION_TIMEOUT=10000
VITE_TRACKING_INTERVAL=5000
VITE_MAP_DEFAULT_ZOOM=13
VITE_ENABLE_MOCK_GPS=true
```

### 4. Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### 5. Production Build
```bash
npm run build
npm run preview
```

## GPS & Location Services Setup

### Browser Permissions
1. Enable location services in your browser
2. Allow location access when prompted
3. For HTTPS deployment, ensure SSL certificate is valid

### Mobile Integration
- The system can track devices using:
  - GPS coordinates
  - Cell tower triangulation
  - WiFi network positioning
  - Bluetooth beacons
  - Manual location updates

### Real-time Tracking
- Location updates every 5 seconds (configurable)
- Battery-optimized tracking modes
- Offline location caching
- Automatic reconnection handling

## Usage Guide

### For Device Owners
1. **Register Account**: Create account with email/phone
2. **Report Device**: Add device with IMEI/serial number
3. **Enable Tracking**: Allow location permissions
4. **Monitor**: View real-time location on dashboard
5. **Alerts**: Receive notifications for location changes

### For Community Members
1. **Report Found Items**: Use public reporting form
2. **Provide Location**: Share where item was found
3. **Contact Info**: Optional contact details for verification

### For Administrators
1. **Admin Panel**: Comprehensive system overview
2. **Analytics**: Track recovery rates and patterns
3. **User Management**: Manage accounts and permissions
4. **System Settings**: Configure tracking parameters

## API Integration

### Location Services
```javascript
// Enable real-time tracking
const tracker = new LocationTracker({
  accuracy: 'high',
  interval: 5000,
  enableBattery: true
});

// Start tracking
tracker.start(deviceId);
```

### Distance Calculation
```javascript
// Calculate distance from current location
const distance = calculateDistance(
  currentLocation,
  deviceLocation
);
```

## Security & Privacy

- **Data Encryption**: All location data encrypted in transit
- **Privacy Controls**: Users control data sharing
- **Secure Authentication**: JWT-based authentication
- **GDPR Compliant**: Data retention and deletion policies
- **Audit Logs**: Complete activity tracking

## Troubleshooting

### Location Not Working
1. Check browser permissions
2. Ensure HTTPS connection
3. Verify GPS is enabled on device
4. Check network connectivity

### Tracking Accuracy Issues
1. Move to open area for better GPS signal
2. Enable high-accuracy mode
3. Check device battery level
4. Restart location services

### Performance Optimization
1. Adjust tracking interval in settings
2. Enable battery optimization mode
3. Clear browser cache
4. Update to latest browser version

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── contexts/           # React contexts
├── services/           # Business logic and APIs
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── styles/             # Global styles
```

### Adding New Features
1. Create feature branch
2. Add TypeScript types
3. Implement components
4. Add tests
5. Update documentation

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v2.0.0 (Current)
- Real-time GPS tracking
- Enhanced mobile integration
- Advanced analytics
- Improved UI/UX
- Performance optimizations

### v1.0.0
- Initial release
- Basic tracking functionality
- User authentication
- Map integration