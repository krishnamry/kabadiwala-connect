import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { config } from '../config';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CITIZEN', 'KABADIWALA', 'ADMIN', 'RECYCLER']).default('CITIZEN'),
  vehicleType: z.string().optional(),
  aadhaarNumber: z.string().optional()
});

const loginSchema = z.object({
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { phone: validated.phone }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this phone number already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
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

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password, ...safeUser } = user;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { phone: validated.phone },
      include: { kabadiwala: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password'
      });
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password'
      });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/demo-users (Instant 1-click test login helper for SIH judges / evaluation)
router.get('/demo-users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        phone: { in: ['9811100001', '9876543210', '9822200002', '9999900000', '9876543212'] }
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
  } catch (err) {
    next(err);
  }
});

export default router;
