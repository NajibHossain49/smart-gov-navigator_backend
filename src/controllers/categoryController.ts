import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/categories
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { services: true } } },
    });
    successResponse(res, 200, 'Categories fetched successfully.', categories);
  } catch (error) {
    console.error('GetAllCategories error:', error);
    errorResponse(res, 500, 'Could not fetch categories.');
  }
};

// GET /api/v1/categories/:id
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await prisma.serviceCategory.findUnique({
      where: { id: parseInt(id) },
      include: { services: { select: { id: true, title: true, fees: true, processing_time: true } } },
    });
    if (!category) { errorResponse(res, 404, 'Category not found.'); return; }
    successResponse(res, 200, 'Category fetched successfully.', category);
  } catch (error) {
    console.error('GetCategoryById error:', error);
    errorResponse(res, 500, 'Could not fetch category.');
  }
};

// POST /api/v1/admin/categories
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length < 2) {
      errorResponse(res, 400, 'Category name is required (min 2 characters).'); return;
    }
    const existing = await prisma.serviceCategory.findUnique({ where: { name: name.trim() } });
    if (existing) { errorResponse(res, 409, 'Category with this name already exists.'); return; }

    const category = await prisma.serviceCategory.create({
      data: { name: name.trim(), description: description || null },
    });
    successResponse(res, 201, 'Category created successfully.', category);
  } catch (error) {
    console.error('CreateCategory error:', error);
    errorResponse(res, 500, 'Could not create category.');
  }
};

// PUT /api/v1/admin/categories/:id
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name && description === undefined) {
      errorResponse(res, 400, 'Provide at least name or description to update.'); return;
    }

    const exists = await prisma.serviceCategory.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Category not found.'); return; }

    const updateData: { name?: string; description?: string } = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    const category = await prisma.serviceCategory.update({ where: { id: parseInt(id) }, data: updateData });
    successResponse(res, 200, 'Category updated successfully.', category);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') { errorResponse(res, 409, 'Category name already exists.'); return; }
    console.error('UpdateCategory error:', error);
    errorResponse(res, 500, 'Could not update category.');
  }
};

// DELETE /api/v1/admin/categories/:id
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exists = await prisma.serviceCategory.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Category not found.'); return; }

    await prisma.serviceCategory.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Category deleted successfully.');
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2003') { errorResponse(res, 400, 'Cannot delete category that has services.'); return; }
    console.error('DeleteCategory error:', error);
    errorResponse(res, 500, 'Could not delete category.');
  }
};
