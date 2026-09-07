import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/rates
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await prisma.scrapRate.findMany({
      orderBy: { ratePerKg: 'desc' }
    });

    return res.json({
      success: true,
      data: rates
    });
  } catch (err) {
    next(err);
  }
});

export default router;
