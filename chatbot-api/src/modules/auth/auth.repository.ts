import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantSettings } from '../tenants/entities/tenant-settings.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(TenantSettings)
    private readonly tenantSettings: Repository<TenantSettings>,
  ) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email, deletedAt: IsNull() } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id, deletedAt: IsNull() } });
  }

  saveUser(user: Partial<User>): Promise<User> {
    return this.users.save(user);
  }

  updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.users.update(id, data).then(() => undefined);
  }

  findTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.tenants.findOne({ where: { slug, deletedAt: IsNull() } });
  }

  saveTenant(tenant: Partial<Tenant>): Promise<Tenant> {
    return this.tenants.save(tenant);
  }

  saveTenantSettings(settings: Partial<TenantSettings>): Promise<TenantSettings> {
    return this.tenantSettings.save(settings);
  }

  saveRefreshToken(token: Partial<RefreshToken>): Promise<RefreshToken> {
    return this.refreshTokens.save(token);
  }

  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokens.findOne({ where: { tokenHash, revokedAt: IsNull() } });
  }

  revokeRefreshToken(id: string): Promise<void> {
    return this.refreshTokens.update(id, { revokedAt: new Date() }).then(() => undefined);
  }

  revokeAllUserRefreshTokens(userId: string): Promise<void> {
    return this.refreshTokens
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute()
      .then(() => undefined);
  }
}
