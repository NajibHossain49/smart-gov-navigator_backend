import { Router } from 'express';
import {
  getAllCategories, getCategoryById,
  createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';

const router = Router();

// Public
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin Only
router.post('/', authMiddleware, roleMiddleware('Admin'), createCategory);
router.put('/:id', authMiddleware, roleMiddleware('Admin'), updateCategory);
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), deleteCategory);

export default router;
