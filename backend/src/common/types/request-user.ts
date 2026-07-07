import { Request } from 'express';
import { UserRole } from '@prisma/client';

export type RequestUser = {
  id: string;
  email?: string;
  role: UserRole;
};

export type RequestWithUser = Request & {
  user: RequestUser;
};
