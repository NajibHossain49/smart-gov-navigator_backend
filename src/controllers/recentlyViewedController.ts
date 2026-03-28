import { Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

// Called internally when a user views a service
export const trackServiceView = async (userId: number, serviceId: number): Promise<void> => {
  try {
    // Upsert: if already viewed, just update the timestamp
    await prisma.recentlyViewed.upsert({
      where: { user_id_service_id: { user_id: userId, service_id: serviceId } },
      update: { viewed_at: new Date() },
      create: { user_id: userId, service_id: serviceId },
    });

    // Also increment the service's global view_count
    await prisma.service.update({
      where: { id: serviceId },
      data: { view_count: { increment: 1 } },
    });
  } catch (error) {
    // Silently fail — tracking should never break the main response
    console.error('TrackServiceView error:', error);
  }
};

// GET /api/v1/users/recently-viewed
export const getRecentlyViewed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const records = await prisma.recentlyViewed.findMany({
      where: { user_id: userId },
      orderBy: { viewed_at: 'desc' },
      take: limit,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            fees: true,
            processing_time: true,
            view_count: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const services = records.map((r) => ({
      ...r.service,
      viewed_at: r.viewed_at,
    }));

    successResponse(res, 200, 'Recently viewed services fetched.', {
      total: services.length,
      services,
    });
  } catch (error) {
    console.error('GetRecentlyViewed error:', error);
    errorResponse(res, 500, 'Could not fetch recently viewed services.');
  }
};

// DELETE /api/v1/users/recently-viewed  — clear all history
export const clearRecentlyViewed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.recentlyViewed.deleteMany({ where: { user_id: userId } });
    successResponse(res, 200, 'View history cleared successfully.');
  } catch (error) {
    console.error('ClearRecentlyViewed error:', error);
    errorResponse(res, 500, 'Could not clear view history.');
  }
};
