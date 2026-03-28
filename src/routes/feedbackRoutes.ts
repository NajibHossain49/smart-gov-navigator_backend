import { Router } from 'express';
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from '../controllers/feedbackController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// All feedback write routes require authentication
// POST   /api/v1/feedbacks        — submit feedback
// PUT    /api/v1/feedbacks/:id    — update own feedback
// DELETE /api/v1/feedbacks/:id    — delete own feedback
router.post('/', authMiddleware, createFeedback as any);
router.put('/:id', authMiddleware, updateFeedback as any);
router.delete('/:id', authMiddleware, deleteFeedback as any);

export default router;
