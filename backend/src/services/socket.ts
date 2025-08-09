import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './database';

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.email} connected`);

    // Join user-specific room
    socket.join(`user:${socket.data.user.id}`);

    // Join role-specific rooms
    if (socket.data.user.role === 'ADMIN' || socket.data.user.role === 'POLICE') {
      socket.join('security');
    }

    // Handle location updates
    socket.on('location:update', async (data) => {
      try {
        const { itemId, itemType, location } = data;

        // Create location record
        const locationRecord = await prisma.location.create({
          data: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            accuracy: location.accuracy,
            source: location.source || 'GPS'
          }
        });

        // Create tracking update
        await prisma.trackingUpdate.create({
          data: {
            itemId,
            itemType,
            locationId: locationRecord.id,
            source: 'Real-time GPS',
            confidence: location.confidence || 1.0
          }
        });

        // Update item's current location
        if (itemType === 'device') {
          await prisma.device.update({
            where: { id: itemId },
            data: { currentLocationId: locationRecord.id }
          });
        } else if (itemType === 'vehicle') {
          await prisma.vehicle.update({
            where: { id: itemId },
            data: { currentLocationId: locationRecord.id }
          });
        }

        // Broadcast to security personnel
        io.to('security').emit('location:updated', {
          itemId,
          itemType,
          location: locationRecord,
          timestamp: new Date()
        });

        console.log(`Location updated for ${itemType} ${itemId}`);
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle emergency alerts
    socket.on('emergency:alert', async (data) => {
      try {
        if (socket.data.user.role !== 'ADMIN' && socket.data.user.role !== 'POLICE') {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        const { type, priority, location, description } = data;

        // Create location record
        const locationRecord = await prisma.location.create({
          data: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            source: 'MANUAL'
          }
        });

        // Create emergency alert
        const alert = await prisma.emergencyAlert.create({
          data: {
            type,
            priority,
            locationId: locationRecord.id,
            description,
            reportedBy: socket.data.user.id
          },
          include: {
            location: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        // Broadcast to all security personnel
        io.to('security').emit('emergency:new', alert);

        console.log(`Emergency alert created: ${type} - ${priority}`);
      } catch (error) {
        console.error('Emergency alert error:', error);
        socket.emit('error', { message: 'Failed to create emergency alert' });
      }
    });

    // Handle item subscriptions
    socket.on('subscribe:item', (itemId) => {
      socket.join(`item:${itemId}`);
      console.log(`User subscribed to item ${itemId}`);
    });

    socket.on('unsubscribe:item', (itemId) => {
      socket.leave(`item:${itemId}`);
      console.log(`User unsubscribed from item ${itemId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.email} disconnected`);
    });
  });

  // Broadcast location updates to subscribers
  const broadcastLocationUpdate = (itemId: string, location: any) => {
    io.to(`item:${itemId}`).emit('location:realtime', {
      itemId,
      location,
      timestamp: new Date()
    });
  };

  return { broadcastLocationUpdate };
};