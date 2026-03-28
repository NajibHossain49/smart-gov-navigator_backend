import { Router } from 'express';
import { updateStep, deleteStep } from '../controllers/stepController';
import { updateDocument, deleteDocument } from '../controllers/documentController';
import { createOffice, updateOffice, deleteOffice } from '../controllers/officeController';
import { createServiceOfficeMapping, deleteServiceOfficeMapping } from '../controllers/serviceOfficeController';
import { getAllFeedbacksAdmin, deleteFeedbackAdmin } from '../controllers/feedbackController';
import { getDashboardStats, getServiceStats } from '../controllers/statsController';
import { getAllUsers, getUserById, toggleUserStatus, changeUserRole, deleteUserByAdmin } from '../controllers/adminUserController';
import { updateEligibilityRule, deleteEligibilityRule } from '../controllers/eligibilityController';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware, roleMiddleware('Admin') as any);

// ── Step Management ──────────────────────────────────────
router.put('/steps/:id',    updateStep);
router.delete('/steps/:id', deleteStep);

// ── Document Management ──────────────────────────────────
router.put('/documents/:id',    updateDocument);
router.delete('/documents/:id', deleteDocument);

// ── Office Management ────────────────────────────────────
router.post('/offices',        createOffice);
router.put('/offices/:id',     updateOffice);
router.delete('/offices/:id',  deleteOffice);

// ── Service-Office Mapping ───────────────────────────────
router.post('/service-offices',        createServiceOfficeMapping);
router.delete('/service-offices/:id',  deleteServiceOfficeMapping);

// ── Feedback Moderation ──────────────────────────────────
router.get('/feedbacks',            getAllFeedbacksAdmin);
router.delete('/feedbacks/:id',     deleteFeedbackAdmin);

// ── Stats & Dashboard  (Segment 6) ───────────────────────
router.get('/stats/dashboard',        getDashboardStats);
router.get('/stats/services/:id',     getServiceStats);

// ── User Management   (Segment 6) ───────────────────────
router.get('/users',                          getAllUsers);
router.get('/users/:id',                      getUserById);
router.patch('/users/:id/toggle-status',      toggleUserStatus);
router.patch('/users/:id/change-role',        changeUserRole);
router.delete('/users/:id',                   deleteUserByAdmin);

// ── Eligibility Rules (Segment 6) ────────────────────────
router.put('/eligibility-rules/:id',    updateEligibilityRule);
router.delete('/eligibility-rules/:id', deleteEligibilityRule);

export default router;
