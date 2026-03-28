import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// GET /api/v1/admin/users  — list all users with filters
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const is_active = req.query.is_active as string | undefined;

    const where: {
      is_active?: boolean;
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          role: { select: { role_name: true } },
          _count: { select: { bookmarks: true, feedbacks: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    successResponse(res, 200, 'Users fetched successfully.', {
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    errorResponse(res, 500, 'Could not fetch users.');
  }
};

// GET /api/v1/admin/users/:id  — get single user detail
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        role: { select: { role_name: true, description: true } },
        _count: { select: { bookmarks: true, feedbacks: true } },
      },
    });

    if (!user) { errorResponse(res, 404, 'User not found.'); return; }
    successResponse(res, 200, 'User fetched successfully.', user);
  } catch (error) {
    console.error('GetUserById error:', error);
    errorResponse(res, 500, 'Could not fetch user.');
  }
};

// PATCH /api/v1/admin/users/:id/toggle-status  — ban or activate user
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: true },
    });

    if (!user) { errorResponse(res, 404, 'User not found.'); return; }

    // Prevent banning another admin
    if (user.role.role_name === 'Admin') {
      errorResponse(res, 403, 'Cannot change the status of an Admin user.'); return;
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { is_active: !user.is_active },
      select: { id: true, name: true, email: true, is_active: true },
    });

    const action = updated.is_active ? 'activated' : 'banned';
    successResponse(res, 200, `User ${action} successfully.`, updated);
  } catch (error) {
    console.error('ToggleUserStatus error:', error);
    errorResponse(res, 500, 'Could not update user status.');
  }
};

// PATCH /api/v1/admin/users/:id/change-role  — promote or demote role
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role_name } = req.body;

    if (!role_name) { errorResponse(res, 400, 'role_name is required.'); return; }

    const role = await prisma.role.findUnique({ where: { role_name } });
    if (!role) { errorResponse(res, 404, `Role "${role_name}" not found.`); return; }

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) { errorResponse(res, 404, 'User not found.'); return; }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role_id: role.id },
      select: {
        id: true, name: true, email: true,
        role: { select: { role_name: true } },
      },
    });

    successResponse(res, 200, `User role changed to "${role_name}" successfully.`, updated);
  } catch (error) {
    console.error('ChangeUserRole error:', error);
    errorResponse(res, 500, 'Could not change user role.');
  }
};

// DELETE /api/v1/admin/users/:id  — hard delete user
export const deleteUserByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: true },
    });

    if (!user) { errorResponse(res, 404, 'User not found.'); return; }
    if (user.role.role_name === 'Admin') {
      errorResponse(res, 403, 'Cannot delete an Admin user.'); return;
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });
    successResponse(res, 200, 'User deleted successfully.');
  } catch (error) {
    console.error('DeleteUserByAdmin error:', error);
    errorResponse(res, 500, 'Could not delete user.');
  }
};
