import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { authMiddleware, AuthRequest, generateToken } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      displayName,
      status: 'online',
      lastSeen: new Date(),
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await user.update({ status: 'online', lastSeen: new Date() });

    const token = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'email', 'displayName', 'avatar', 'status', 'lastSeen', 'createdAt'],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { displayName, avatar, status } = req.body;
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.update({ displayName, avatar, status, lastSeen: new Date() });
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/users/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }
    const users = await User.findAll({
      where: {
        displayName: { $like: `%${q}%` },
        id: { $ne: req.user!.id },
      },
      attributes: ['id', 'displayName', 'email', 'avatar', 'status'],
      limit: 20,
    });
    res.json(users);
  } catch (error) {
    // Fallback for different Sequelize versions
    try {
      const { q } = req.query;
      const users = await User.findAll({
        attributes: ['id', 'displayName', 'email', 'avatar', 'status'],
        limit: 20,
      });
      const filtered = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes((q as string).toLowerCase()) &&
          u.id !== req.user!.id
      );
      res.json(filtered);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

export default router;
