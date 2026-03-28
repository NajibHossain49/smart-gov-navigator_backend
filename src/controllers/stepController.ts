import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/services/:id/steps
export const getStepsByService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const steps = await prisma.serviceStep.findMany({
      where: { service_id: parseInt(id) },
      orderBy: { step_number: 'asc' },
    });
    successResponse(res, 200, 'Steps fetched successfully.', { service_id: parseInt(id), steps });
  } catch (error) {
    console.error('GetStepsByService error:', error);
    errorResponse(res, 500, 'Could not fetch steps.');
  }
};

// POST /api/v1/admin/services/:id/steps
export const createStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { step_number, step_title, step_description } = req.body;

    if (!step_number || !step_title) { errorResponse(res, 400, 'Step number and title are required.'); return; }

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const step = await prisma.serviceStep.create({
      data: {
        service_id: parseInt(id),
        step_number: parseInt(step_number),
        step_title: step_title.trim(),
        step_description: step_description || null,
      },
    });
    successResponse(res, 201, 'Step created successfully.', step);
  } catch (error) {
    console.error('CreateStep error:', error);
    errorResponse(res, 500, 'Could not create step.');
  }
};

// PUT /api/v1/admin/steps/:id
export const updateStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { step_number, step_title, step_description } = req.body;

    const exists = await prisma.serviceStep.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Step not found.'); return; }

    const updateData: { step_number?: number; step_title?: string; step_description?: string | null } = {};
    if (step_number) updateData.step_number = parseInt(step_number);
    if (step_title) updateData.step_title = step_title.trim();
    if (step_description !== undefined) updateData.step_description = step_description;

    const step = await prisma.serviceStep.update({ where: { id: parseInt(id) }, data: updateData });
    successResponse(res, 200, 'Step updated successfully.', step);
  } catch (error) {
    console.error('UpdateStep error:', error);
    errorResponse(res, 500, 'Could not update step.');
  }
};

// DELETE /api/v1/admin/steps/:id
export const deleteStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exists = await prisma.serviceStep.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Step not found.'); return; }

    await prisma.serviceStep.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Step deleted successfully.');
  } catch (error) {
    console.error('DeleteStep error:', error);
    errorResponse(res, 500, 'Could not delete step.');
  }
};
