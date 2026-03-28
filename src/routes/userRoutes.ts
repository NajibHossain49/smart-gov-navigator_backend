import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/userController';
import { getRecentlyViewed, clearRecentlyViewed } from '../controllers/recentlyViewedController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Profile
router.get('/profile',          getProfile as any);
router.put('/profile',          updateProfile as any);
router.delete('/account',       deleteAccount as any);

// Recently Viewed — Segment 6
router.get('/recently-viewed',    getRecentlyViewed as any);
router.delete('/recently-viewed', clearRecentlyViewed as any);

export default router;
