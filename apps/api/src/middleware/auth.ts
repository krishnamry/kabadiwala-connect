import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export type UserRole = 'CITIZEN' | 'KABADIWALA' | 'ADMIN' | 'RECYCLER' | 'COLLECTOR' | 'REGULATORY' | 'citizen' | 'collector' | 'recycler' | 'regulatory';

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export const isRegulatoryUser = (role?: string) => role === 'ADMIN' || role === 'REGULATORY' || role === 'regulatory';
export const isCollectorUser = (role?: string) => role === 'KABADIWALA' || role === 'COLLECTOR' || role === 'collector';
export const isRecyclerUser = (role?: string) => role === 'RECYCLER' || role === 'recycler';
export const isCitizenUser = (role?: string) => role === 'CITIZEN' || role === 'citizen';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token'
    });
  }
};

export const requireRole = (allowedRoles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const currentRole = req.user.role;
    const matches = allowedRoles.some(r => {
      if (r === currentRole) return true;
      if ((r === 'ADMIN' || r === 'REGULATORY' || r === 'regulatory') && isRegulatoryUser(currentRole)) return true;
      if ((r === 'KABADIWALA' || r === 'COLLECTOR' || r === 'collector') && isCollectorUser(currentRole)) return true;
      if ((r === 'RECYCLER' || r === 'recycler') && isRecyclerUser(currentRole)) return true;
      if ((r === 'CITIZEN' || r === 'citizen') && isCitizenUser(currentRole)) return true;
      return false;
    });

    if (!matches) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: requires one of [${allowedRoles.join(', ')}] role`
      });
    }

    next();
  };
};
