import { Router } from 'express';
import {
  getAllServices, getServiceById, searchServices,
  getServicesByCategory, createService, updateService, deleteService,
  getRelatedServices,
} from '../controllers/serviceController';
import { getStepsByService, createStep } from '../controllers/stepController';
import { getDocumentsByService, createDocument } from '../controllers/documentController';
import { getOfficesByService } from '../controllers/serviceOfficeController';
import { getFeedbacksByService } from '../controllers/feedbackController';
import { getEligibilityRules, checkEligibility, createEligibilityRule } from '../controllers/eligibilityController';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';

const router = Router();

// ── Public Routes ─────────────────────────────────────────
router.get('/',                           getAllServices);
router.get('/search',                     searchServices);
router.get('/category/:category_id',      getServicesByCategory);
router.get('/:id',                        getServiceById);
router.get('/:id/steps',                  getStepsByService);
router.get('/:id/documents',              getDocumentsByService);
router.get('/:id/offices',                getOfficesByService);
router.get('/:id/feedbacks',              getFeedbacksByService);
router.get('/:id/related',               getRelatedServices);           // ← Segment 6
router.get('/:id/eligibility-rules',      getEligibilityRules);         // ← Segment 6
router.post('/:id/check-eligibility',     checkEligibility);             // ← Segment 6

// ── Admin Only Routes ─────────────────────────────────────
router.post('/',              authMiddleware, roleMiddleware('Admin'), createService);
router.put('/:id',            authMiddleware, roleMiddleware('Admin'), updateService);
router.delete('/:id',         authMiddleware, roleMiddleware('Admin'), deleteService);
router.post('/:id/steps',     authMiddleware, roleMiddleware('Admin'), createStep);
router.post('/:id/documents', authMiddleware, roleMiddleware('Admin'), createDocument);
router.post('/:id/eligibility-rules', authMiddleware, roleMiddleware('Admin'), createEligibilityRule); // ← Segment 6

export default router;
