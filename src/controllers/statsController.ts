import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/admin/stats/dashboard  — overall system summary
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalServices,
      totalCategories,
      totalOffices,
      totalBookmarks,
      totalFeedbacks,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.service.count(),
      prisma.serviceCategory.count(),
      prisma.governmentOffice.count(),
      prisma.bookmark.count(),
      prisma.feedback.count(),
      prisma.user.count({ where: { is_active: true } }),
    ]);

    // Average rating across all feedbacks
    const ratingAgg = await prisma.feedback.aggregate({ _avg: { rating: true } });

    // Top 5 most viewed services
    const topViewedServices = await prisma.service.findMany({
      orderBy: { view_count: 'desc' },
      take: 5,
      select: {
        id: true, title: true, view_count: true,
        category: { select: { name: true } },
        _count: { select: { bookmarks: true, feedbacks: true } },
      },
    });

    // Top 5 most bookmarked services
    const topBookmarkedServices = await prisma.service.findMany({
      orderBy: { bookmarks: { _count: 'desc' } },
      take: 5,
      select: {
        id: true, title: true, view_count: true,
        category: { select: { name: true } },
        _count: { select: { bookmarks: true, feedbacks: true } },
      },
    });

    // Services per category
    const categoryCounts = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { services: true } },
      },
      orderBy: { services: { _count: 'desc' } },
    });

    // New users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await prisma.user.count({
      where: { created_at: { gte: thirtyDaysAgo } },
    });

    successResponse(res, 200, 'Dashboard stats fetched.', {
      overview: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: totalUsers - activeUsers,
        new_users_last_30_days: newUsersLast30Days,
        total_services: totalServices,
        total_categories: totalCategories,
        total_offices: totalOffices,
        total_bookmarks: totalBookmarks,
        total_feedbacks: totalFeedbacks,
        average_rating: ratingAgg._avg.rating
          ? parseFloat(ratingAgg._avg.rating.toFixed(2))
          : null,
      },
      top_viewed_services: topViewedServices,
      top_bookmarked_services: topBookmarkedServices,
      services_per_category: categoryCounts,
    });
  } catch (error) {
    console.error('GetDashboardStats error:', error);
    errorResponse(res, 500, 'Could not fetch dashboard stats.');
  }
};

// GET /api/v1/admin/stats/services/:id  — individual service stats
export const getServiceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true, title: true, view_count: true,
        category: { select: { name: true } },
        _count: { select: { bookmarks: true, feedbacks: true, steps: true, required_documents: true } },
      },
    });

    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    // Rating breakdown
    const ratingAgg = await prisma.feedback.aggregate({
      where: { service_id: parseInt(id) },
      _avg: { rating: true },
      _min: { rating: true },
      _max: { rating: true },
    });

    // Rating distribution (1–5)
    const ratingDist = await prisma.feedback.groupBy({
      by: ['rating'],
      where: { service_id: parseInt(id) },
      _count: { rating: true },
      orderBy: { rating: 'asc' },
    });

    successResponse(res, 200, 'Service stats fetched.', {
      service,
      ratings: {
        average: ratingAgg._avg.rating ? parseFloat(ratingAgg._avg.rating.toFixed(2)) : null,
        min: ratingAgg._min.rating,
        max: ratingAgg._max.rating,
        distribution: ratingDist.map((r) => ({ rating: r.rating, count: r._count.rating })),
      },
    });
  } catch (error) {
    console.error('GetServiceStats error:', error);
    errorResponse(res, 500, 'Could not fetch service stats.');
  }
};
