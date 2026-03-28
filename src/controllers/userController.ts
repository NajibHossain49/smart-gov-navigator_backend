import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

// GET /api/v1/users/profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, created_at: true, updated_at: true,
        role: { select: { role_name: true } },
      },
    });
    if (!user) { errorResponse(res, 404, 'User not found.'); return; }
    successResponse(res, 200, 'Profile fetched successfully.', user);
  } catch (error) {
    console.error('GetProfile error:', error);
    errorResponse(res, 500, 'Could not fetch profile.');
  }
};

// PUT /api/v1/users/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body;
    if (!name && !password) { errorResponse(res, 400, 'Provide at least name or password to update.'); return; }

    const updateData: { name?: string; password_hash?: string } = {};

    if (name) {
      if (name.trim().length < 2) { errorResponse(res, 400, 'Name must be at least 2 characters.'); return; }
      updateData.name = name.trim();
    }
    if (password) {
      if (password.length < 6) { errorResponse(res, 400, 'Password must be at least 6 characters.'); return; }
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: { id: true, name: true, email: true, updated_at: true, role: { select: { role_name: true } } },
    });
    successResponse(res, 200, 'Profile updated successfully.', updatedUser);
  } catch (error) {
    console.error('UpdateProfile error:', error);
    errorResponse(res, 500, 'Could not update profile.');
  }
};

// DELETE /api/v1/users/account
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    successResponse(res, 200, 'Account deleted successfully.');
  } catch (error) {
    console.error('DeleteAccount error:', error);
    errorResponse(res, 500, 'Could not delete account.');
  }
};
