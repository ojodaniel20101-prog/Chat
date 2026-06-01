import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zentrix-chat-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    displayName: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authorization token required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      displayName: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const generateToken = (user: { id: number; email: string; displayName: string }): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};
