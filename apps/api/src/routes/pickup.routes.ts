import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

const createPickupSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    category: z.string(),
    estWeightKg: z.number().positive(),
    ratePerKg: z.number().positive(),
    imageUrl: z.string().optional()
  })).min(1, 'At least one scrap item must be added')
});

const completePickupSchema = z.object({
  items: z.array(z.object({
    category: z.string(),
    actualWeightKg: z.number().positive().optional(),
    weightKg: z.number().positive().optional()
  })).min(1, 'Actual weights for items required')
});

// Haversine formula for distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/pickups - Citizen creates new pickup
router.post('/', authenticateToken, requireRole(['CITIZEN', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createPickupSchema.parse(req.body);

    const pickup = await prisma.pickup.create({
      data: {
        citizenId: req.user!.id,
        address: validated.address,
        latitude: validated.latitude,
        longitude: validated.longitude,
        scheduledAt: new Date(validated.scheduledAt),
        notes: validated.notes || null,
        status: 'REQUESTED',
        items: {
          create: validated.items.map(item => ({
            category: item.category,
            estWeightKg: item.estWeightKg,
            ratePerKg: item.ratePerKg,
            imageUrl: item.imageUrl || null
          }))
        }
      },
      include: {
        items: true,
        citizen: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Pickup request created successfully',
      data: pickup
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/pickups/my - List pickups for logged-in citizen or kabadiwala
router.get('/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isKabadiwala = req.user!.role === 'KABADIWALA';

    const pickups = await prisma.pickup.findMany({
      where: isKabadiwala ? { kabadiwalaId: req.user!.id } : { citizenId: req.user!.id },
      include: {
        items: true,
        citizen: { select: { id: true, name: true, phone: true } },
        kabadiwala: {
          select: {
            id: true,
            name: true,
            phone: true,
            kabadiwala: { select: { reputationScore: true, verified: true, vehicleType: true } }
          }
        },
        transactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: pickups
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/pickups/nearby - Open pickups within radius for Kabadiwalas
router.get('/nearby', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.5685;
    const lng = parseFloat(req.query.lng as string) || 77.2412;
    const radius = parseFloat(req.query.radius as string) || 15.0; // km

    const openPickups = await prisma.pickup.findMany({
      where: {
        status: 'REQUESTED'
      },
      include: {
        items: true,
        citizen: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate distance and filter
    const withDistance = openPickups
      .map(p => {
        const distanceKm = getDistanceKm(lat, lng, p.latitude, p.longitude);
        return {
          ...p,
          distanceKm: Math.round(distanceKm * 10) / 10
        };
      })
      .filter(p => p.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({
      success: true,
      data: withDistance
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/pickups/:id - Single pickup details
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pickup = await prisma.pickup.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        citizen: { select: { id: true, name: true, phone: true } },
        kabadiwala: {
          select: {
            id: true,
            name: true,
            phone: true,
            kabadiwala: { select: { reputationScore: true, verified: true, vehicleType: true } }
          }
        },
        transactions: true
      }
    });

    if (!pickup) {
      return res.status(404).json({ success: false, error: 'Pickup not found' });
    }

    return res.json({
      success: true,
      data: pickup
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/pickups/:id/accept - Kabadiwala accepts pickup
router.post('/:id/accept', authenticateToken, requireRole(['KABADIWALA', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pickupId = req.params.id;

    const pickup = await prisma.pickup.findUnique({
      where: { id: pickupId }
    });

    if (!pickup) {
      return res.status(404).json({ success: false, error: 'Pickup not found' });
    }

    if (pickup.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        error: `Pickup cannot be accepted; current status is ${pickup.status}`
      });
    }

    const updated = await prisma.pickup.update({
      where: { id: pickupId },
      data: {
        kabadiwalaId: req.user!.id,
        status: 'ACCEPTED'
      },
      include: {
        items: true,
        citizen: { select: { id: true, name: true, phone: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Pickup accepted! Head to the location.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/pickups/:id/in-progress - Kabadiwala arrives at location
router.post('/:id/in-progress', authenticateToken, requireRole(['KABADIWALA', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await prisma.pickup.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS' },
      include: { items: true, citizen: true }
    });

    return res.json({
      success: true,
      message: 'Pickup marked In Progress. Weighing items.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/pickups/:id/complete - Kabadiwala enters final weights, completes pickup & issues payout
router.post('/:id/complete', authenticateToken, requireRole(['KABADIWALA', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = completePickupSchema.parse(req.body);
    const pickupId = req.params.id;

    const pickup = await prisma.pickup.findUnique({
      where: { id: pickupId },
      include: { items: true }
    });

    if (!pickup) {
      return res.status(404).json({ success: false, error: 'Pickup not found' });
    }

    if (pickup.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Pickup is already completed' });
    }

    // Calculate total amount from validated actual weights and ratePerKg
    let calculatedTotal = 0;
    for (const weightedItem of validated.items) {
      const weight = weightedItem.actualWeightKg ?? weightedItem.weightKg ?? 1.0;
      const existingItem = pickup.items.find(i => i.category.toLowerCase() === weightedItem.category.toLowerCase()) || pickup.items[0];
      const rate = existingItem ? existingItem.ratePerKg : 15.0;
      calculatedTotal += weight * rate;

      if (existingItem) {
        await prisma.scrapItem.update({
          where: { id: existingItem.id },
          data: { actualWeightKg: weight }
        });
      }
    }

    // Round total
    const totalAmount = Math.round(calculatedTotal * 100) / 100;

    // Update pickup
    const completedPickup = await prisma.pickup.update({
      where: { id: pickupId },
      data: {
        status: 'COMPLETED',
        totalAmount,
        completedAt: new Date()
      },
      include: { items: true, citizen: true }
    });

    // Create Transaction ledger entry
    const transaction = await prisma.transaction.create({
      data: {
        pickupId: pickup.id,
        amount: totalAmount,
        kabadiwalaId: pickup.kabadiwalaId || req.user!.id,
        status: 'PAID',
        paymentMethod: 'WALLET_ESCROW'
      }
    });

    // Update Kabadiwala wallet
    const kabadiwalaId = pickup.kabadiwalaId || req.user!.id;
    await prisma.kabadiwalaProfile.updateMany({
      where: { userId: kabadiwalaId },
      data: {
        walletBalance: { increment: totalAmount }
      }
    });

    return res.json({
      success: true,
      message: `Pickup completed successfully! Payment of ₹${totalAmount} processed.`,
      data: {
        pickup: completedPickup,
        transaction,
        totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/pickups/:id/cancel - Cancel pickup
router.post('/:id/cancel', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pickup = await prisma.pickup.findUnique({
      where: { id: req.params.id }
    });

    if (!pickup) {
      return res.status(404).json({ success: false, error: 'Pickup not found' });
    }

    if (pickup.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Completed pickups cannot be cancelled' });
    }

    const updated = await prisma.pickup.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    return res.json({
      success: true,
      message: 'Pickup cancelled',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
