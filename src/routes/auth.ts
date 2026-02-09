import { Router } from 'express';
import { login, logout, me } from '../controllers/auth_controller';
import authMiddleware from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout (Protected - requires Bearer token)
router.post('/logout', authMiddleware, logout);

// GET /api/auth/me (Protected)
router.get('/me', authMiddleware, me);

export default router;
