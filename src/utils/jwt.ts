import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import ms from "ms";

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as ms.StringValue,
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JwtPayload & TokenPayload => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as JwtPayload & TokenPayload;
};
