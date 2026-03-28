import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/offices
export const getAllOffices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { district, upazila } = req.query;

    const where: { district?: string; upazila?: string } = {};
    if (district) where.district = district as string;
    if (upazila) where.upazila = upazila as string;

    const offices = await prisma.governmentOffice.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    successResponse(res, 200, 'Offices fetched successfully.', offices);
  } catch (error) {
    console.error('GetAllOffices error:', error);
    errorResponse(res, 500, 'Could not fetch offices.');
  }
};

// GET /api/v1/offices/:id
export const getOfficeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const office = await prisma.governmentOffice.findUnique({
      where: { id: parseInt(id) },
      include: {
        service_offices: {
          include: {
            service: { select: { id: true, title: true, fees: true, processing_time: true } },
          },
        },
      },
    });

    if (!office) { errorResponse(res, 404, 'Office not found.'); return; }
    successResponse(res, 200, 'Office fetched successfully.', office);
  } catch (error) {
    console.error('GetOfficeById error:', error);
    errorResponse(res, 500, 'Could not fetch office.');
  }
};

// POST /api/v1/admin/offices
export const createOffice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, office_type, address, district, upazila, phone, email, office_hours } = req.body;

    if (!name || name.trim().length < 2) {
      errorResponse(res, 400, 'Office name is required (min 2 characters).'); return;
    }

    const office = await prisma.governmentOffice.create({
      data: {
        name: name.trim(),
        office_type: office_type || null,
        address: address || null,
        district: district || null,
        upazila: upazila || null,
        phone: phone || null,
        email: email || null,
        office_hours: office_hours || null,
      },
    });

    successResponse(res, 201, 'Office created successfully.', office);
  } catch (error) {
    console.error('CreateOffice error:', error);
    errorResponse(res, 500, 'Could not create office.');
  }
};

// PUT /api/v1/admin/offices/:id
export const updateOffice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, office_type, address, district, upazila, phone, email, office_hours } = req.body;

    const exists = await prisma.governmentOffice.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Office not found.'); return; }

    const updateData: Record<string, string | null> = {};
    if (name) updateData.name = name.trim();
    if (office_type !== undefined) updateData.office_type = office_type;
    if (address !== undefined) updateData.address = address;
    if (district !== undefined) updateData.district = district;
    if (upazila !== undefined) updateData.upazila = upazila;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (office_hours !== undefined) updateData.office_hours = office_hours;

    if (Object.keys(updateData).length === 0) {
      errorResponse(res, 400, 'No valid fields provided to update.'); return;
    }

    const office = await prisma.governmentOffice.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    successResponse(res, 200, 'Office updated successfully.', office);
  } catch (error) {
    console.error('UpdateOffice error:', error);
    errorResponse(res, 500, 'Could not update office.');
  }
};

// DELETE /api/v1/admin/offices/:id
export const deleteOffice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const exists = await prisma.governmentOffice.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Office not found.'); return; }

    await prisma.governmentOffice.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Office deleted successfully.');
  } catch (error) {
    console.error('DeleteOffice error:', error);
    errorResponse(res, 500, 'Could not delete office.');
  }
};
