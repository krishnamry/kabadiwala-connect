"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    phone: zod_1.z.string().min(10, 'Phone must be at least 10 digits'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['CITIZEN', 'KABADIWALA', 'ADMIN']).default('CITIZEN'),
    vehicleType: zod_1.z.string().optional(),
    aadhaarNumber: zod_1.z.string().optional()
});
const loginSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10, 'Valid phone number is required'),
    password: zod_1.z.string().min(1, 'Password is required')
});
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const validated = registerSchema.parse(req.body);
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { phone: validated.phone }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'A user with this phone number already exists'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(validated.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: validated.name,
                phone: validated.phone,
                password: hashedPassword,
                role: validated.role,
                kabadiwala: validated.role === 'KABADIWALA' ? {
                    create: {
                        vehicleType: validated.vehicleType || 'Cargo Rickshaw',
                        aadhaarNumber: validated.aadhaarNumber || 'Verified In-Person',
                        verified: false,
                        reputationScore: 5.0,
                        walletBalance: 0
                    }
                } : undefined
            },
            include: {
                kabadiwala: true
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name, phone: user.phone, role: user.role }, config_1.config.jwtSecret, { expiresIn: '7d' });
        const { password, ...safeUser } = user;
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token,
                user: safeUser
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const validated = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { phone: validated.phone },
            include: { kabadiwala: true }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid phone number or password'
            });
        }
        const isMatch = await bcryptjs_1.default.compare(validated.password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid phone number or password'
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name, phone: user.phone, role: user.role }, config_1.config.jwtSecret, { expiresIn: '7d' });
        const { password, ...safeUser } = user;
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: safeUser
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/auth/me
router.get('/me', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { kabadiwala: true }
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const { password, ...safeUser } = user;
        return res.json({
            success: true,
            data: safeUser
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/auth/demo-users (Instant 1-click test login helper for SIH judges / evaluation)
router.get('/demo-users', async (req, res, next) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            where: {
                phone: { in: ['9811100001', '9876543210', '9999900000', '9876543212'] }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                kabadiwala: {
                    select: {
                        verified: true,
                        walletBalance: true,
                        reputationScore: true
                    }
                }
            }
        });
        return res.json({
            success: true,
            data: users
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
