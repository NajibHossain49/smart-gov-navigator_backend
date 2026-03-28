import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

// POST /api/v1/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      errorResponse(res, 400, 'Name, email and password are required.'); return;
    }
    if (password.length < 6) {
      errorResponse(res, 400, 'Password must be at least 6 characters.'); return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) { errorResponse(res, 409, 'Email already registered.'); return; }

    let userRole = await prisma.role.findUnique({ where: { role_name: 'User' } });
    if (!userRole) {
      userRole = await prisma.role.create({ data: { role_name: 'User', description: 'Regular user' } });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password_hash, role_id: userRole.id },
      select: { id: true, name: true, email: true, created_at: true, role: { select: { role_name: true } } },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role.role_name });
    successResponse(res, 201, 'Registration successful.', { user, token });
  } catch (error) {
    console.error('Register error:', error);
    errorResponse(res, 500, 'Registration failed.');
  }
};

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) { errorResponse(res, 400, 'Email and password are required.'); return; }

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user) { errorResponse(res, 401, 'Invalid email or password.'); return; }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) { errorResponse(res, 401, 'Invalid email or password.'); return; }

    const token = generateToken({ id: user.id, email: user.email, role: user.role.role_name });
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role.role_name, created_at: user.created_at };

    successResponse(res, 200, 'Login successful.', { user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, 'Login failed.');
  }
};

// POST /api/v1/auth/logout
export const logout = async (_req: Request, res: Response): Promise<void> => {
  successResponse(res, 200, 'Logged out successfully.');
};

// GET /api/v1/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, created_at: true, updated_at: true,
        role: { select: { role_name: true, description: true } },
      },
    });
    if (!user) { errorResponse(res, 404, 'User not found.'); return; }
    successResponse(res, 200, 'User fetched successfully.', user);
  } catch (error) {
    console.error('GetMe error:', error);
    errorResponse(res, 500, 'Could not fetch user.');
  }
};
