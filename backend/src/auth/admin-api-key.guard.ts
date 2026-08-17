import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_API_KEY?.trim();
    if (!expected) {
      throw new UnauthorizedException('ADMIN_API_KEY is not configured');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-admin-api-key')?.trim();
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing X-Admin-Api-Key');
    }
    return true;
  }
}
