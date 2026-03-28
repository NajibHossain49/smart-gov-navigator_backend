import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

// GET /api/v1/services/:id/feedbacks  (Public)
export const getFeedbacksByService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { service_id: parseInt(id) },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.feedback.count({ where: { service_id: parseInt(id) } }),
    ]);

    // Average rating
    const aggregate = await prisma.feedback.aggregate({
      where: { service_id: parseInt(id) },
      _avg: { rating: true },
      _count: { rating: true },
    });

    successResponse(res, 200, 'Feedbacks fetched successfully.', {
      service_id: parseInt(id),
      average_rating: aggregate._avg.rating
        ? parseFloat(aggregate._avg.rating.toFixed(1))
        : null,
      total_reviews: aggregate._count.rating,
      feedbacks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GetFeedbacksByService error:', error);
    errorResponse(res, 500, 'Could not fetch feedbacks.');
  }
};

// POST /api/v1/feedbacks  (Auth)
export const createFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { service_id, rating, comment } = req.body;

    if (!service_id || rating === undefined) {
      errorResponse(res, 400, 'service_id and rating are required.'); return;
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errorResponse(res, 400, 'Rating must be a number between 1 and 5.'); return;
    }

    const service = await prisma.service.findUnique({ where: { id: parseInt(service_id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    // One feedback per user per service
    const existing = await prisma.feedback.findUnique({
      where: {
        user_id_service_id: {
          user_id: userId,
          service_id: parseInt(service_id),
        },
      },
    });
    if (existing) {
      errorResponse(res, 409, 'You have already submitted feedback for this service. You can update it instead.'); return;
    }

    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId,
        service_id: parseInt(service_id),
        rating: ratingNum,
        comment: comment?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
    });

    successResponse(res, 201, 'Feedback submitted successfully.', feedback);
  } catch (error) {
    console.error('CreateFeedback error:', error);
    errorResponse(res, 500, 'Could not submit feedback.');
  }
};

// PUT /api/v1/feedbacks/:id  (Auth - own only)
export const updateFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (rating === undefined && comment === undefined) {
      errorResponse(res, 400, 'Provide at least rating or comment to update.'); return;
    }

    const feedback = await prisma.feedback.findUnique({ where: { id: parseInt(id) } });
    if (!feedback) { errorResponse(res, 404, 'Feedback not found.'); return; }

    if (feedback.user_id !== userId) {
      errorResponse(res, 403, 'You are not allowed to update this feedback.'); return;
    }

    const updateData: { rating?: number; comment?: string | null } = {};
    if (rating !== undefined) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        errorResponse(res, 400, 'Rating must be a number between 1 and 5.'); return;
      }
      updateData.rating = ratingNum;
    }
    if (comment !== undefined) updateData.comment = comment?.trim() || null;

    const updated = await prisma.feedback.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { user: { select: { id: true, name: true } }, service: { select: { id: true, title: true } } },
    });

    successResponse(res, 200, 'Feedback updated successfully.', updated);
  } catch (error) {
    console.error('UpdateFeedback error:', error);
    errorResponse(res, 500, 'Could not update feedback.');
  }
};

// DELETE /api/v1/feedbacks/:id  (Auth - own only)
export const deleteFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({ where: { id: parseInt(id) } });
    if (!feedback) { errorResponse(res, 404, 'Feedback not found.'); return; }

    if (feedback.user_id !== userId) {
      errorResponse(res, 403, 'You are not allowed to delete this feedback.'); return;
    }

    await prisma.feedback.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Feedback deleted successfully.');
  } catch (error) {
    console.error('DeleteFeedback error:', error);
    errorResponse(res, 500, 'Could not delete feedback.');
  }
};

// GET /api/v1/admin/feedbacks  (Admin only)
export const getAllFeedbacksAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, title: true } },
      },
    });
    successResponse(res, 200, 'All feedbacks fetched successfully.', {
      total: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error('GetAllFeedbacksAdmin error:', error);
    errorResponse(res, 500, 'Could not fetch feedbacks.');
  }
};

// DELETE /api/v1/admin/feedbacks/:id  (Admin only)
export const deleteFeedbackAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const feedback = await prisma.feedback.findUnique({ where: { id: parseInt(id) } });
    if (!feedback) { errorResponse(res, 404, 'Feedback not found.'); return; }

    await prisma.feedback.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Feedback deleted by admin successfully.');
  } catch (error) {
    console.error('DeleteFeedbackAdmin error:', error);
    errorResponse(res, 500, 'Could not delete feedback.');
  }
};
