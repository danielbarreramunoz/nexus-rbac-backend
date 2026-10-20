import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../jwt-payload.interface.js';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
