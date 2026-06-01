/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';

import { Request } from 'express';
import type { JwtUser } from '../decorators/user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const apiKey = this.extractApiKey(request);

    if (!token && !apiKey) {
      throw new UnauthorizedException();
    }

    if (apiKey) {
      const user = await this.findUserByApiKey(apiKey);

      if (!user) {
        throw new UnauthorizedException();
      }

      request['user'] = {
        id: user.id,
        role: 'viewer',
        apiKey: true,
      };
      return true;
    }

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!payload.role) {
        throw new UnauthorizedException();
      }

      request['user'] = payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractApiKey(request: Request): string | undefined {
    const headerValue = request.headers['x-api-key'];
    if (typeof headerValue === 'string') return headerValue;
    if (Array.isArray(headerValue)) return headerValue[0];

    const queryValue = request.query.apiKey;
    return typeof queryValue === 'string' ? queryValue : undefined;
  }

  private async findUserByApiKey(apiKey: string) {
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

    const [user] = await this.dataSource.query<{ id: number }[]>(
      'SELECT id FROM users WHERE "apiKeyHash" = $1 LIMIT 1',
      [apiKeyHash],
    );

    return user;
  }
}
