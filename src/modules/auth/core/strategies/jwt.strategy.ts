import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '@common/prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret-key',
    });
  }

  async validate(payload: any): Promise<JwtPayload> {
    const rawUserId = payload.user_id ?? payload.userId ?? payload.sub;

    if (!rawUserId) {
      throw new UnauthorizedException('Token payload tidak valid');
    }

    const userId = Number(rawUserId);

    // If payload contains M1 token format (user_id, role, etc.)
    if (payload.role !== undefined || payload.user_id !== undefined) {
      return {
        userId,
        user_id: userId,
        email: payload.email || '',
        name: payload.name || '',
        role: payload.role || 'customer',
        division: payload.division || '',
        unit_usaha_id: payload.unit_usaha_id ? Number(payload.unit_usaha_id) : undefined,
        permissions: payload.permissions || (payload.role ? [payload.role] : []),
      };
    }

    // Otherwise check local DB if available
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          position: {
            include: {
              position_permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (user && user.is_active) {
        const permissions = user.position.position_permissions.map((pp) => pp.permission.name);
        return {
          userId: user.id,
          user_id: user.id,
          email: user.email,
          positionId: user.position.id,
          positionName: user.position.name,
          permissions,
        };
      }
    } catch {
      // If table doesn't exist or DB unreachable, fallback to payload claims
    }

    return {
      userId,
      user_id: userId,
      email: payload.email || '',
      role: 'customer',
      permissions: [],
    };
  }
}
