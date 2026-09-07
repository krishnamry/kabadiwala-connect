import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/kabadiwala/wallet - Wallet balance & transaction history
router.get('/wallet', authenticateToken, requireRole(['KABADIWALA', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.kabadiwalaProfile.findUnique({
      where: { userId: req.user!.id }
    });

    const transactions = await prisma.transaction.findMany({
      where: { kabadiwalaId: req.user!.id },
      include: {
        pickup: {
          include: {
            items: true,
            citizen: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalEarned = transactions.reduce((acc, t) => acc + t.amount, 0);

    return res.json({
      success: true,
      data: {
        walletBalance: profile ? profile.walletBalance : 0,
        totalEarned: Math.round(totalEarned * 100) / 100,
        transactionCount: transactions.length,
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/kabadiwala/profile - Collector details & reputation
router.get('/profile', authenticateToken, requireRole(['KABADIWALA', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.kabadiwalaProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, phone: true, role: true, createdAt: true } }
      }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Kabadiwala profile not found' });
    }

    const completedJobsCount = await prisma.pickup.count({
      where: { kabadiwalaId: req.user!.id, status: 'COMPLETED' }
    });

    return res.json({
      success: true,
      data: {
        ...profile,
        completedJobsCount
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/kabadiwala/location - Live GPS coordinates update
router.post('/location', authenticateToken, requireRole(['KABADIWALA', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required' });
    }

    await prisma.kabadiwalaProfile.update({
      where: { userId: req.user!.id },
      data: { latitude, longitude }
    });

    return res.json({
      success: true,
      message: 'Location updated successfully',
      data: { latitude, longitude }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
