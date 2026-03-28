import { Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

// GET /api/v1/bookmarks
export const getMyBookmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            fees: true,
            processing_time: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    successResponse(res, 200, 'Bookmarks fetched successfully.', {
      total: bookmarks.length,
      bookmarks,
    });
  } catch (error) {
    console.error('GetMyBookmarks error:', error);
    errorResponse(res, 500, 'Could not fetch bookmarks.');
  }
};

// POST /api/v1/bookmarks
export const createBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { service_id } = req.body;

    if (!service_id) {
      errorResponse(res, 400, 'service_id is required.'); return;
    }

    // Check service exists
    const service = await prisma.service.findUnique({ where: { id: parseInt(service_id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    // Check duplicate bookmark
    const existing = await prisma.bookmark.findUnique({
      where: {
        user_id_service_id: {
          user_id: userId,
          service_id: parseInt(service_id),
        },
      },
    });
    if (existing) { errorResponse(res, 409, 'Service is already bookmarked.'); return; }

    const bookmark = await prisma.bookmark.create({
      data: {
        user_id: userId,
        service_id: parseInt(service_id),
      },
      include: {
        service: { select: { id: true, title: true, category: { select: { name: true } } } },
      },
    });

    successResponse(res, 201, 'Service bookmarked successfully.', bookmark);
  } catch (error) {
    console.error('CreateBookmark error:', error);
    errorResponse(res, 500, 'Could not create bookmark.');
  }
};

// DELETE /api/v1/bookmarks/:id
export const deleteBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const bookmark = await prisma.bookmark.findUnique({ where: { id: parseInt(id) } });
    if (!bookmark) { errorResponse(res, 404, 'Bookmark not found.'); return; }

    // Only owner can delete their own bookmark
    if (bookmark.user_id !== userId) {
      errorResponse(res, 403, 'You are not allowed to delete this bookmark.'); return;
    }

    await prisma.bookmark.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Bookmark removed successfully.');
  } catch (error) {
    console.error('DeleteBookmark error:', error);
    errorResponse(res, 500, 'Could not delete bookmark.');
  }
};
