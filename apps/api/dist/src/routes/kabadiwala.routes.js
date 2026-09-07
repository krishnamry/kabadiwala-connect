"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/kabadiwala/wallet - Wallet balance & transaction history
router.get('/wallet', auth_1.authenticateToken, (0, auth_1.requireRole)(['KABADIWALA', 'ADMIN']), async (req, res, next) => {
    try {
        const profile = await prisma_1.prisma.kabadiwalaProfile.findUnique({
            where: { userId: req.user.id }
        });
        const transactions = await prisma_1.prisma.transaction.findMany({
            where: { kabadiwalaId: req.user.id },
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
    }
    catch (err) {
        next(err);
    }
});
// GET /api/kabadiwala/profile - Collector details & reputation
router.get('/profile', auth_1.authenticateToken, (0, auth_1.requireRole)(['KABADIWALA', 'ADMIN']), async (req, res, next) => {
    try {
        const profile = await prisma_1.prisma.kabadiwalaProfile.findUnique({
            where: { userId: req.user.id },
            include: {
                user: { select: { id: true, name: true, phone: true, role: true, createdAt: true } }
            }
        });
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Kabadiwala profile not found' });
        }
        const completedJobsCount = await prisma_1.prisma.pickup.count({
            where: { kabadiwalaId: req.user.id, status: 'COMPLETED' }
        });
        return res.json({
            success: true,
            data: {
                ...profile,
                completedJobsCount
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/kabadiwala/location - Live GPS coordinates update
router.post('/location', auth_1.authenticateToken, (0, auth_1.requireRole)(['KABADIWALA', 'ADMIN']), async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required' });
        }
        await prisma_1.prisma.kabadiwalaProfile.update({
            where: { userId: req.user.id },
            data: { latitude, longitude }
        });
        return res.json({
            success: true,
            message: 'Location updated successfully',
            data: { latitude, longitude }
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
