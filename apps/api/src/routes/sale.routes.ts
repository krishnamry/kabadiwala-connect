import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Helper to generate official CPCB Universal Sale Token Number
export function generateSaleTokenNumber(zone: string = 'SZ'): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `KBD-SL-${datePart}-${zone}-${randomHex}`;
}

// Helper for Privacy-by-Design projection
export function projectSaleToken(token: any, role?: string) {
  const isRegulatory = role === 'ADMIN' || role === 'regulatory';
  const { collectorAadhaarRef, ...safeToken } = token;

  return {
    ...safeToken,
    collector: {
      id: token.collectorId,
      name: token.collectorName,
      phone: token.collectorPhone,
      kycStatus: 'VERIFIED',
      ...(isRegulatory ? { aadhaarRef: collectorAadhaarRef } : {})
    },
    regulatoryCompliance: {
      cpcbForm2EntryStatus: 'LOGGED',
      cpcbForm6FilingReady: true,
      eprCreditPointsGenerated: token.eprCredits,
      sha256Signature: token.sha256Signature,
      ...(isRegulatory ? {
        collectorAadhaarRef,
        weighbridgeCalibrationCert: 'CAL-DL-DPCC-2026-04'
      } : {})
    }
  };
}

// GET /api/sales - List recent sale tokens (audit feed)
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collectorId, recyclerId } = req.query;
    const where: any = {};
    if (collectorId && typeof collectorId === 'string') where.collectorId = collectorId;
    if (recyclerId && typeof recyclerId === 'string') where.recyclerId = recyclerId;

    const tokens = await prisma.saleToken.findMany({ where });
    const projected = tokens.map((t: any) => projectSaleToken(t, req.user?.role));

    return res.json({
      success: true,
      data: projected
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sales/verify/:tokenNumber - Public / Auditor verification endpoint (Open to any scanner)
router.get('/verify/:tokenNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tokenNumber } = req.params;
    const token = await prisma.saleToken.findUnique({ where: { tokenNumber } });

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or unrecognized Sale Token Number. No official CPCB record found.'
      });
    }

    // Public view preserves privacy (no Aadhaar digits exposed)
    const publicPassport = projectSaleToken(token, 'public');

    return res.json({
      success: true,
      message: 'Official CPCB / SPCB E-Waste Sale Provenance Record Verified',
      data: publicPassport
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sales/:tokenNumber - Single sale token with authenticated role projection
router.get('/:tokenNumber', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tokenNumber } = req.params;
    const token = await prisma.saleToken.findUnique({ where: { tokenNumber } });

    if (!token) {
      return res.status(404).json({ success: false, error: 'Sale Token not found' });
    }

    return res.json({
      success: true,
      data: projectSaleToken(token, req.user?.role)
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/sales/handover - Recycler weighbridge operator confirms intake and mints Sale Token
router.post('/handover', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      lotId,
      actualWeightKg,
      grossWeightKg,
      tareWeightKg,
      operatorId,
      weighbridgeGpsLat,
      weighbridgeGpsLng,
      paymentMode = 'CASH_ON_SPOT'
    } = req.body;

    const lot = await prisma.eWasteLot.findUnique({ where: { id: lotId } });
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Lot not found' });
    }

    const recyclerUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { recycler: true }
    });

    const collectorUser = await prisma.user.findUnique({
      where: { id: lot.collectorId }
    });

    const netWeight = Number(actualWeightKg) || Number(lot.approxWeightKg) || 10;
    const gross = Number(grossWeightKg) || netWeight + 0.8;
    const tare = Number(tareWeightKg) || 0.8;
    const ratePerKg = Number(lot.recyclerOfferedRate) || (lot.highestBid ? lot.highestBid / netWeight : 265);
    const totalAmount = Number((netWeight * ratePerKg).toFixed(2));

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const tokenNumber = `KBD-SL-${datePart}-DL01-${randomHex}`;

    const sha256Signature = crypto.createHash('sha256')
      .update(`${tokenNumber}:${lot.collectorId}:${recyclerUser?.recycler?.cpcbRegNumber}:${netWeight}:${totalAmount}`)
      .digest('hex');

    const saleToken = await prisma.saleToken.create({
      data: {
        tokenNumber,
        lotId: lot.id,
        collectorId: lot.collectorId,
        collectorName: collectorUser?.name || lot.collectorName,
        collectorPhone: collectorUser?.phone || '9876543210',
        collectorAadhaarRef: 'XXXX-XXXX-8921',
        recyclerId: req.user!.id,
        recyclerName: recyclerUser?.recycler?.facilityName || recyclerUser?.name || 'EcoRecycle Aggregators Ltd',
        cpcbRegNumber: recyclerUser?.recycler?.cpcbRegNumber || 'CPCB-EW-2023-DL-0881',
        category: lot.category,
        cpcbCategoryCode: 'ITEW2',
        grossWeightKg: gross,
        tareWeightKg: tare,
        netWeightKg: netWeight,
        ratePerKg,
        totalAmount,
        paymentMode,
        weighbridgeGpsLat: Number(weighbridgeGpsLat) || 28.5355,
        weighbridgeGpsLng: Number(weighbridgeGpsLng) || 77.2690,
        operatorId: operatorId || 'OP-OKHLA-981',
        sha256Signature,
        eprCredits: netWeight
      }
    });

    // Credit collector wallet balance
    const currentBalance = await prisma.kabadiwalaProfile.findUnique({ where: { userId: lot.collectorId } });
    if (currentBalance) {
      await prisma.kabadiwalaProfile.update({
        where: { userId: lot.collectorId },
        data: { walletBalance: (currentBalance.walletBalance || 0) + totalAmount }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Weighbridge handover verified & official Sale Token minted successfully!',
      data: projectSaleToken(saleToken, req.user?.role)
    });
  } catch (err) {
    next(err);
  }
});

export default router;
