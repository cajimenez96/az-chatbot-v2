import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { TenantStatus } from '@converxa/types';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.repo.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const slugTaken = await this.repo.findTenantBySlug(dto.tenantSlug);
    if (slugTaken) throw new ConflictException('Tenant slug already taken');

    return this.dataSource.transaction(async () => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await this.repo.saveTenant({
        name: dto.tenantName,
        slug: dto.tenantSlug,
        status: TenantStatus.TRIAL,
        trialEndsAt,
      });

      await this.repo.saveTenantSettings({ tenantId: tenant.id });

      const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

      const user = await this.repo.saveUser({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        tenantId: tenant.id,
      });

      await this.repo.updateUser(tenant.id, { ownerUserId: user.id } as any);

      return this.issueTokenPair(user.id, user.tenantId, user.role as any);
    });
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    return this.issueTokenPair(user.id, user.tenantId, user.role as any);
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.repo.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    await this.repo.revokeRefreshToken(stored.id);

    const user = await this.repo.findUserById(stored.userId);
    if (!user || !user.isActive) throw new UnauthorizedException('User not found');

    return this.issueTokenPair(user.id, user.tenantId, user.role as any);
  }

  async logout(userId: string): Promise<void> {
    await this.repo.revokeAllUserRefreshTokens(userId);
  }

  private async issueTokenPair(
    userId: string,
    tenantId: string | null,
    role: string,
  ): Promise<TokenPair> {
    const privateKey = this.config.get<string>('JWT_PRIVATE_KEY')!.replace(/\\n/g, '\n');
    const accessToken = jwt.sign({ sub: userId, tenantId, role }, privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repo.saveRefreshToken({ userId, tokenHash, expiresAt });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
