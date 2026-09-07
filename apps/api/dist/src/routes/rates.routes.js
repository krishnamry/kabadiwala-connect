"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// GET /api/rates
router.get('/', async (req, res, next) => {
    try {
        const rates = await prisma_1.prisma.scrapRate.findMany({
            orderBy: { ratePerKg: 'desc' }
        });
        return res.json({
            success: true,
            data: rates
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
