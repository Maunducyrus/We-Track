import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, DeviceType, ItemStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all devices (admin/police) or user's devices
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      isActive: true
    };

    // Users can only see their own devices
    if (req.user?.role === 'USER') {
      where.reportedBy = req.user.id;
    }

    if (status) {
      where.status = status as ItemStatus;
    }

    if (type) {
      where.type = type as DeviceType;
    }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          lastKnownLocation: true,
          currentLocation: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.device.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        data: devices,
        total,
        page: Number(page),
        limit: Number(limit),
        hasNext: skip + devices.length < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get device by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        lastKnownLocation: true,
        currentLocation: true,
        trackingUpdates: {
          include: { location: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Users can only access their own devices
    if (req.user?.role === 'USER' && device.reportedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Create device
router.post('/', [
  body('name').trim().isLength({ min: 1 }),
  body('type').isIn(['PHONE', 'LAPTOP', 'TABLET', 'OTHER']),
  body('brand').trim().isLength({ min: 1 }),
  body('model').trim().isLength({ min: 1 }),
  body('serialNumber').trim().isLength({ min: 1 }),
  body('imei').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('color').optional().trim(),
  body('description').optional().trim()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deviceData = {
      ...req.body,
      reportedBy: req.user!.id
    };

    // Create location if provided
    let locationId;
    if (req.body.location) {
      const location = await prisma.location.create({
        data: {
          latitude: req.body.location.latitude,
          longitude: req.body.location.longitude,
          address: req.body.location.address,
          source: 'MANUAL'
        }
      });
      locationId = location.id;
    }

    const device = await prisma.device.create({
      data: {
        ...deviceData,
        lastKnownLocationId: locationId,
        currentLocationId: locationId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        lastKnownLocation: true,
        currentLocation: true
      }
    });

    res.status(201).json({
      success: true,
      data: device,
      message: 'Device reported successfully'
    });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Update device
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Users can only update their own devices
    if (req.user?.role === 'USER' && device.reportedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: req.body,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        lastKnownLocation: true,
        currentLocation: true
      }
    });

    res.json({
      success: true,
      data: updatedDevice,
      message: 'Device updated successfully'
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Users can only delete their own devices
    if (req.user?.role === 'USER' && device.reportedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.device.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router;