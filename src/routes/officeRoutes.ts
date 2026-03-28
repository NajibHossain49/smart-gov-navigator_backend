import { Router } from 'express';
import {
  getAllOffices,
  getOfficeById,
  createOffice,
  updateOffice,
  deleteOffice,
} from '../controllers/officeController';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';

const router = Router();

// Public Routes
// GET /api/v1/offices          — all offices
// GET /api/v1/offices?district=Dhaka
// GET /api/v1/offices?upazila=Kaliganj
router.get('/', getAllOffices);
router.get('/:id', getOfficeById);

// Admin Only Routes
router.post('/', authMiddleware, roleMiddleware('Admin'), createOffice);
router.put('/:id', authMiddleware, roleMiddleware('Admin'), updateOffice);
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), deleteOffice);

export default router;
