import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/services/:id/documents
export const getDocumentsByService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const documents = await prisma.requiredDocument.findMany({
      where: { service_id: parseInt(id) },
      orderBy: { id: 'asc' },
    });
    successResponse(res, 200, 'Documents fetched successfully.', { service_id: parseInt(id), documents });
  } catch (error) {
    console.error('GetDocumentsByService error:', error);
    errorResponse(res, 500, 'Could not fetch documents.');
  }
};

// POST /api/v1/admin/services/:id/documents
export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { document_name, description } = req.body;

    if (!document_name || document_name.trim().length < 2) {
      errorResponse(res, 400, 'Document name is required (min 2 characters).'); return;
    }

    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) { errorResponse(res, 404, 'Service not found.'); return; }

    const document = await prisma.requiredDocument.create({
      data: { service_id: parseInt(id), document_name: document_name.trim(), description: description || null },
    });
    successResponse(res, 201, 'Document requirement created successfully.', document);
  } catch (error) {
    console.error('CreateDocument error:', error);
    errorResponse(res, 500, 'Could not create document.');
  }
};

// PUT /api/v1/admin/documents/:id
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { document_name, description } = req.body;

    const exists = await prisma.requiredDocument.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Document not found.'); return; }

    const updateData: { document_name?: string; description?: string | null } = {};
    if (document_name) updateData.document_name = document_name.trim();
    if (description !== undefined) updateData.description = description;

    const document = await prisma.requiredDocument.update({ where: { id: parseInt(id) }, data: updateData });
    successResponse(res, 200, 'Document updated successfully.', document);
  } catch (error) {
    console.error('UpdateDocument error:', error);
    errorResponse(res, 500, 'Could not update document.');
  }
};

// DELETE /api/v1/admin/documents/:id
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exists = await prisma.requiredDocument.findUnique({ where: { id: parseInt(id) } });
    if (!exists) { errorResponse(res, 404, 'Document not found.'); return; }

    await prisma.requiredDocument.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'Document deleted successfully.');
  } catch (error) {
    console.error('DeleteDocument error:', error);
    errorResponse(res, 500, 'Could not delete document.');
  }
};
