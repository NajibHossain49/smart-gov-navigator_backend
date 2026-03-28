import { Router } from 'express';
import {
  getMyBookmarks,
  createBookmark,
  deleteBookmark,
} from '../controllers/bookmarkController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// All bookmark routes require authentication
router.use(authMiddleware);

// GET  /api/v1/bookmarks        — get my bookmarks
// POST /api/v1/bookmarks        — add bookmark
// DELETE /api/v1/bookmarks/:id  — remove bookmark
router.get('/', getMyBookmarks as any);
router.post('/', createBookmark as any);
router.delete('/:id', deleteBookmark as any);

export default router;
