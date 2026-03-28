import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/services/:id/offices
export const getOfficesByService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const serviceOffices = await prisma.serviceOffice.findMany({
      where: { service_id: parseInt(id) },
      include: { office: true },
    });

    const offices = serviceOffices.map((so) => so.office);
    successResponse(res, 200, 'Offices for service fetched successfully.', {
      service_id: parseInt(id),
      service_title: service.title,
      offices,
    });
  } catch (error) {
    console.error('GetOfficesByService error:', error);
    errorResponse(res, 500, 'Could not fetch offices for service.');
  }
};

// POST /api/v1/admin/service-offices
export const createServiceOfficeMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const { service_id, office_id } = req.body;

    if (!service_id || !office_id) {
      errorResponse(res, 400, 'service_id and office_id are required.'); return;
    }

    const service = await prisma.service.findUnique({ where: { id: parseInt(service_id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const office = await prisma.governmentOffice.findUnique({ where: { id: parseInt(office_id) } });
    if (!office) { errorResponse(res, 404, 'Office not found.'); return; }

    // Check for duplicate mapping
    const existing = await prisma.serviceOffice.findUnique({
      where: {
        service_id_office_id: {
          service_id: parseInt(service_id),
          office_id: parseInt(office_id),
        },
      },
    });
    if (existing) { errorResponse(res, 409, 'This service-office mapping already exists.'); return; }

    const mapping = await prisma.serviceOffice.create({
      data: {
        service_id: parseInt(service_id),
        office_id: parseInt(office_id),
      },
      include: {
        service: { select: { id: true, title: true } },
        office: { select: { id: true, name: true, district: true, upazila: true } },
      },
    });

    successResponse(res, 201, 'Service-office mapping created successfully.', mapping);
  } catch (error) {
    console.error('CreateServiceOfficeMapping error:', error);
    errorResponse(res, 500, 'Could not create service-office mapping.');
  }
};

// DELETE /api/v1/admin/service-offices/:id
export const deleteServiceOfficeMapping = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const exists = await prisma.serviceOffice.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Service-office mapping not found.'); return; }

    await prisma.serviceOffice.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Service-office mapping deleted successfully.');
  } catch (error) {
    console.error('DeleteServiceOfficeMapping error:', error);
    errorResponse(res, 500, 'Could not delete service-office mapping.');
  }
};
