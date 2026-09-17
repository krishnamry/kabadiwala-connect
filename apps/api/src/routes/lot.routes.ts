import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, isRegulatoryUser } from '../middleware/auth';

const router = Router();

// GET /api/lots - List e-waste lots
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collectorId, status, category } = req.query;
    const where: any = {};
    if (collectorId && typeof collectorId === 'string') where.collectorId = collectorId;
    if (status && typeof status === 'string') where.status = status;
    if (category && typeof category === 'string') where.category = category;

    const lots = await prisma.eWasteLot.findMany({ where });
    return res.json({
      success: true,
      data: lots
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/lots/:id - Get single lot by id or lotCode
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let lot = await prisma.eWasteLot.findUnique({ where: { id } });
    if (!lot) {
      lot = await prisma.eWasteLot.findUnique({ where: { lotCode: id } });
    }
    if (!lot) {
      return res.status(404).json({ success: false, error: 'E-waste lot not found' });
    }
    return res.json({
      success: true,
      data: lot
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/lots - Create new e-waste lot
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      approxWeightKg,
      totalItems,
      estimatedValue,
      askingPrice,
      minBidAmount,
      items,
      auctionDurationMins = 60,
      gpsLat,
      gpsLng,
      locationAddress,
      locationZone,
      imageUrl,
      isCustomLot
    } = req.body;

    const collectorId = req.user!.id;
    const collectorUser = await prisma.user.findUnique({ where: { id: collectorId } });

    // Check KYC Tier limit: Unverified collectors can create max 1 active lot with ₹5,000 cap
    if (collectorUser?.kycStatus !== 'VERIFIED') {
      const activeLots = await prisma.eWasteLot.findMany({
        where: { collectorId, status: 'AVAILABLE' }
      });
      if (activeLots.length >= 1) {
        return res.status(403).json({
          success: false,
          error: 'Unverified account limit reached (max 1 active lot). Please complete KYC to unlock unlimited trading.'
        });
      }
      if ((askingPrice || estimatedValue || 0) > 5000) {
        return res.status(403).json({
          success: false,
          error: 'Unverified account value limit exceeded (max ₹5,000). Please complete KYC to list higher-value lots.'
        });
      }
    }

    const duration = Math.max(15, Number(auctionDurationMins) || 60);
    const auctionExpiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

    const lot = await prisma.eWasteLot.create({
      data: {
        collectorId,
        collectorName: collectorUser?.name || 'Collector',
        category,
        approxWeightKg: Number(approxWeightKg) || 1,
        totalItems: Number(totalItems) || 1,
        estimatedValue: Number(estimatedValue) || 0,
        askingPrice: Number(askingPrice) || Number(estimatedValue) || 0,
        minBidAmount: Number(minBidAmount) || 0,
        recyclerOfferedRate: 0,
        status: 'AVAILABLE',
        auctionDurationMins: duration,
        auctionExpiresAt,
        gpsLat: Number(gpsLat) || 28.5685,
        gpsLng: Number(gpsLng) || 77.2412,
        locationAddress: locationAddress || 'Scrap Yard',
        locationZone: locationZone || 'Delhi NCR',
        imageUrl: imageUrl || null,
        isCustomLot: Boolean(isCustomLot),
        items: items || []
      }
    });

    return res.status(201).json({
      success: true,
      message: 'E-waste lot created successfully',
      data: lot
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/lots/:id/bids - Place a bid on a live lot
router.post('/:id/bids', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { bidAmount, bidPerKg, notes } = req.body;

    const lot = await prisma.eWasteLot.findUnique({ where: { id } });
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Lot not found' });
    }

    if (lot.status !== 'AVAILABLE' && lot.status !== 'BIDDING') {
      return res.status(400).json({ success: false, error: 'This lot is no longer open for bidding' });
    }

    // Check if auction timer expired
    const now = Date.now();
    if (lot.auctionExpiresAt && new Date(lot.auctionExpiresAt).getTime() < now) {
      return res.status(400).json({ success: false, error: 'Auction countdown has ended for this lot' });
    }

    const recyclerId = req.user!.id;
    const recycler = await prisma.user.findUnique({
      where: { id: recyclerId },
      include: { recycler: true }
    });

    const recyclerName = recycler?.recycler?.facilityName || recycler?.name || 'EcoRecycle Partner';

    const bid = await prisma.lotBid.create({
      data: {
        lotId: lot.id,
        recyclerId,
        recyclerName,
        bidAmount: Number(bidAmount),
        bidPerKg: Number(bidPerKg),
        status: 'PENDING',
        notes: notes || null
      }
    });

    // Soft Anti-Sniping Extension Rule:
    // If bid is placed in the final 60 seconds of the countdown, automatically extend by +2 minutes
    if (lot.auctionExpiresAt) {
      const remainingMs = new Date(lot.auctionExpiresAt).getTime() - now;
      if (remainingMs > 0 && remainingMs <= 60000) {
        const newExpiry = new Date(new Date(lot.auctionExpiresAt).getTime() + 120000).toISOString();
        await prisma.eWasteLot.update({
          where: { id: lot.id },
          data: {
            auctionExpiresAt: newExpiry,
            antiSnipingExtensions: (lot.antiSnipingExtensions || 0) + 1
          }
        });
      }
    }

    const updatedLot = await prisma.eWasteLot.findUnique({ where: { id: lot.id } });

    return res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: {
        bid,
        lot: updatedLot
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/lots/:id/accept - Accept winning bid (locks lot and generates Handover pass)
router.post('/:id/accept', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { bidId } = req.body;

    const lot = await prisma.eWasteLot.findUnique({ where: { id } });
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Lot not found' });
    }

    // Verify ownership
    if (lot.collectorId !== req.user!.id && !isRegulatoryUser(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to accept bids on this lot' });
    }

    const bids = await prisma.lotBid.findMany({ where: { lotId: lot.id } });
    const selectedBid = bidId ? bids.find((b: any) => b.id === bidId) : bids[0];

    if (!selectedBid) {
      return res.status(400).json({ success: false, error: 'No valid bid available to accept' });
    }

    // Update selected bid to ACCEPTED, others to REJECTED
    for (const b of bids) {
      await prisma.lotBid.update({
        where: { id: b.id },
        data: { status: b.id === selectedBid.id ? 'ACCEPTED' : 'REJECTED' }
      });
    }

    const updatedLot = await prisma.eWasteLot.update({
      where: { id: lot.id },
      data: {
        status: 'HANDOVER_PENDING',
        winningBidId: selectedBid.id,
        highestBid: selectedBid.bidAmount,
        recyclerId: selectedBid.recyclerId,
        recyclerName: selectedBid.recyclerName,
        recyclerOfferedRate: selectedBid.bidPerKg
      }
    });

    return res.json({
      success: true,
      message: 'Bid accepted! Handover pass generated.',
      data: updatedLot
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/lots/:id/cancel - Cancel lot
router.post('/:id/cancel', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lot = await prisma.eWasteLot.findUnique({ where: { id } });
    if (!lot) return res.status(404).json({ success: false, error: 'Lot not found' });
    if (lot.collectorId !== req.user!.id && !isRegulatoryUser(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const updated = await prisma.eWasteLot.update({
      where: { id: lot.id },
      data: { status: 'CANCELLED' }
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
