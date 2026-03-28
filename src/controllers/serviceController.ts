import { Request, Response } from 'express';
import { trackServiceView } from './recentlyViewedController';
import { AuthRequest } from '../types';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

const serviceInclude = {
  category: { select: { id: true, name: true } },
  _count: { select: { feedbacks: true, bookmarks: true } },
};

// GET /api/v1/services
export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({ skip, take: limit, orderBy: { created_at: 'desc' }, include: serviceInclude }),
      prisma.service.count(),
    ]);

    successResponse(res, 200, 'Services fetched successfully.', {
      services,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GetAllServices error:', error);
    errorResponse(res, 500, 'Could not fetch services.');
  }
};

// GET /api/v1/services/:id
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: { select: { id: true, name: true } },
        steps: { orderBy: { step_number: 'asc' } },
        required_documents: true,
        service_offices: { include: { office: true } },
        feedbacks: {
          take: 5,
          orderBy: { created_at: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { feedbacks: true, bookmarks: true } },
      },
    });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }
    // Track view for authenticated users (Segment 6)
    const authReq = req as AuthRequest;
    if (authReq.user) await trackServiceView(authReq.user.id, parseInt(id));
    successResponse(res, 200, 'Service fetched successfully.', service);
  } catch (error) {
    console.error('GetServiceById error:', error);
    errorResponse(res, 500, 'Could not fetch service.');
  }
};

// GET /api/v1/services/search?q=keyword
export const searchServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 1) { errorResponse(res, 400, 'Search keyword is required.'); return; }

    const services = await prisma.service.findMany({
      where: {
        OR: [
          { title: { contains: q.trim(), mode: 'insensitive' } },
          { description: { contains: q.trim(), mode: 'insensitive' } },
          { application_process: { contains: q.trim(), mode: 'insensitive' } },
        ],
      },
      include: serviceInclude,
      orderBy: { created_at: 'desc' },
    });
    successResponse(res, 200, `Found ${services.length} service(s) for "${q}".`, services);
  } catch (error) {
    console.error('SearchServices error:', error);
    errorResponse(res, 500, 'Search failed.');
  }
};

// GET /api/v1/services/category/:category_id
export const getServicesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id } = req.params;
    const category = await prisma.serviceCategory.findUnique({ where: { id: parseInt(category_id) } });
    if (!category) { errorResponse(res, 404, 'Category not found.'); return; }

    const services = await prisma.service.findMany({
      where: { category_id: parseInt(category_id) },
      include: serviceInclude,
      orderBy: { created_at: 'desc' },
    });
    successResponse(res, 200, 'Services fetched by category.', { category, services });
  } catch (error) {
    console.error('GetServicesByCategory error:', error);
    errorResponse(res, 500, 'Could not fetch services by category.');
  }
};

// POST /api/v1/admin/services
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id, title, description, application_process, fees, processing_time } = req.body;
    if (!category_id || !title) { errorResponse(res, 400, 'Category ID and title are required.'); return; }

    const categoryExists = await prisma.serviceCategory.findUnique({ where: { id: parseInt(category_id) } });
    if (!categoryExists) { errorResponse(res, 404, 'Category not found.'); return; }

    const service = await prisma.service.create({
      data: {
        category_id: parseInt(category_id),
        title: title.trim(),
        description: description || null,
        application_process: application_process || null,
        fees: fees || null,
        processing_time: processing_time || null,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    successResponse(res, 201, 'Service created successfully.', service);
  } catch (error) {
    console.error('CreateService error:', error);
    errorResponse(res, 500, 'Could not create service.');
  }
};

// PUT /api/v1/admin/services/:id
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category_id, title, description, application_process, fees, processing_time } = req.body;

    const exists = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Service not found.'); return; }

    const updateData: Record<string, unknown> = {};
    if (category_id) {
      const cat = await prisma.serviceCategory.findUnique({ where: { id: parseInt(category_id) } });
      if (!cat) { errorResponse(res, 404, 'Category not found.'); return; }
      updateData.category_id = parseInt(category_id);
    }
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (application_process !== undefined) updateData.application_process = application_process;
    if (fees !== undefined) updateData.fees = fees;
    if (processing_time !== undefined) updateData.processing_time = processing_time;

    const service = await prisma.service.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: { select: { id: true, name: true } } },
    });
    successResponse(res, 200, 'Service updated successfully.', service);
  } catch (error) {
    console.error('UpdateService error:', error);
    errorResponse(res, 500, 'Could not update service.');
  }
};

// DELETE /api/v1/admin/services/:id
export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exists = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Service not found.'); return; }

    await prisma.service.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Service deleted successfully.');
  } catch (error) {
    console.error('DeleteService error:', error);
    errorResponse(res, 500, 'Could not delete service.');
  }
};

// GET /api/v1/services/:id/related  — Feature: Related Services
export const getRelatedServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      select: { category_id: true, title: true },
    });

    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    // Fetch services in the same category, excluding the current one
    const related = await prisma.service.findMany({
      where: {
        category_id: service.category_id,
        id: { not: parseInt(id) },
      },
      take: limit,
      orderBy: { view_count: 'desc' },
      select: {
        id: true,
        title: true,
        fees: true,
        processing_time: true,
        view_count: true,
        category: { select: { id: true, name: true } },
        _count: { select: { feedbacks: true, bookmarks: true } },
      },
    });

    successResponse(res, 200, 'Related services fetched.', {
      service_id: parseInt(id),
      related_services: related,
    });
  } catch (error) {
    console.error('GetRelatedServices error:', error);
    errorResponse(res, 500, 'Could not fetch related services.');
  }
};
