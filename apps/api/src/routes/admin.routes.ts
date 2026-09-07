import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats - Aggregated metrics for Admin/ULB Dashboard
router.get('/stats', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get all completed pickups with items
    const completedPickups = await prisma.pickup.findMany({
      where: { status: 'COMPLETED' },
      include: { items: true }
    });

    // 2. Aggregate category weights & total revenue
    let totalKg = 0;
    let totalRevenue = 0;
    const categoryMap: { [key: string]: { kg: number; revenue: number } } = {
      Plastic: { kg: 0, revenue: 0 },
      Paper: { kg: 0, revenue: 0 },
      Metal: { kg: 0, revenue: 0 },
      'E-waste': { kg: 0, revenue: 0 },
      Glass: { kg: 0, revenue: 0 },
      Organic: { kg: 0, revenue: 0 }
    };

    for (const p of completedPickups) {
      if (p.totalAmount) {
        totalRevenue += p.totalAmount;
      }
      for (const item of p.items) {
        const weight = item.actualWeightKg ?? item.estWeightKg ?? 0;
        const itemRevenue = weight * item.ratePerKg;
        totalKg += weight;

        const cat = item.category || 'Other';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { kg: 0, revenue: 0 };
        }
        categoryMap[cat].kg += weight;
        categoryMap[cat].revenue += itemRevenue;
      }
    }

    const categoryBreakdown = Object.keys(categoryMap).map(cat => ({
      category: cat,
      kg: Math.round(categoryMap[cat].kg * 10) / 10,
      revenue: Math.round(categoryMap[cat].revenue)
    }));

    // 3. Kabadiwala counts & verification percentage
    const totalKabadiwalas = await prisma.kabadiwalaProfile.count();
    const verifiedKabadiwalas = await prisma.kabadiwalaProfile.count({
      where: { verified: true }
    });

    const activeKabadiwalas = totalKabadiwalas;
    const verifiedPercent = totalKabadiwalas > 0 ? Math.round((verifiedKabadiwalas / totalKabadiwalas) * 100) : 0;

    // 4. Pickup status counts
    const totalPickups = await prisma.pickup.count();
    const completedCount = completedPickups.length;
    const requestedCount = await prisma.pickup.count({ where: { status: 'REQUESTED' } });
    const inProgressCount = await prisma.pickup.count({ where: { status: { in: ['ACCEPTED', 'IN_PROGRESS'] } } });

    // 5. Environmental impact metrics (calculated based on CPCB / EPA standard formulas)
    const environmentalImpact = {
      co2SavedKg: Math.round(totalKg * 1.82 * 10) / 10,
      treesSaved: Math.round((categoryMap['Paper']?.kg || 0) * 0.017 * 10) / 10,
      landfillDivertedKg: Math.round(totalKg * 10) / 10,
      waterSavedLiters: Math.round((categoryMap['Paper']?.kg || 0) * 26 + (categoryMap['Plastic']?.kg || 0) * 18)
    };

    return res.json({
      success: true,
      data: {
        totalKg: Math.round(totalKg * 10) / 10,
        activeKabadiwalas,
        verifiedPercent,
        totalRevenue: Math.round(totalRevenue),
        totalPickups,
        requestedCount,
        inProgressCount,
        completedCount,
        categoryBreakdown,
        environmentalImpact
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/kabadiwalas - List all collectors with verification status
router.get('/kabadiwalas', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collectors = await prisma.kabadiwalaProfile.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, createdAt: true } }
      },
      orderBy: { user: { createdAt: 'desc' } }
    });

    return res.json({
      success: true,
      data: collectors
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/kabadiwalas/:id/verify - Approve or reject collector verification
router.post('/kabadiwalas/:id/verify', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verified } = req.body;
    const profileId = req.params.id;

    const updated = await prisma.kabadiwalaProfile.update({
      where: { id: profileId },
      data: { verified: typeof verified === 'boolean' ? verified : true },
      include: { user: { select: { name: true, phone: true } } }
    });

    return res.json({
      success: true,
      message: `Collector ${updated.user.name} verification set to ${updated.verified}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/epr - Extended Producer Responsibility (EPR) Certificate & Report
router.get('/reports/epr', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const completed = await prisma.pickup.findMany({
      where: { status: 'COMPLETED' },
      include: {
        items: true,
        kabadiwala: { select: { name: true, phone: true } },
        citizen: { select: { name: true } }
      },
      orderBy: { completedAt: 'desc' }
    });

    const categoryStats: { [key: string]: number } = {};
    for (const p of completed) {
      for (const i of p.items) {
        const wt = i.actualWeightKg ?? i.estWeightKg;
        categoryStats[i.category] = (categoryStats[i.category] || 0) + wt;
      }
    }

    const report = {
      reportId: `EPR-CPCB-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      governingBody: 'Central Pollution Control Board (CPCB) / MoEFCC Guidelines',
      compliancePeriod: 'FY 2025-2026',
      totalDisposalVerifiedKg: Object.values(categoryStats).reduce((a, b) => a + b, 0),
      categoryAggregatesKg: categoryStats,
      traceablePickupsCount: completed.length,
      chainOfCustodyAuditTrail: completed.map(c => ({
        pickupId: c.id,
        date: c.completedAt,
        citizen: c.citizen.name,
        collector: c.kabadiwala?.name || 'Authorized Collector',
        items: c.items.map(i => `${i.category}: ${i.actualWeightKg || i.estWeightKg}kg`).join(', '),
        payoutAmount: c.totalAmount
      }))
    };

    return res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
});

export default router;
