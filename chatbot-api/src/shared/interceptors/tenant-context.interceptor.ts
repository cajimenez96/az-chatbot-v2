import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, lastValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { AuthUser } from '../guards/jwt-auth.guard';
import { Role } from '@converxa/types';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    return new Observable((observer) => {
      this.dataSource
        .transaction(async (manager) => {
          if (user?.tenantId) {
            await manager.query(`SET LOCAL app.current_tenant_id = $1`, [user.tenantId]);
          }

          if (user?.role === Role.SUPER_ADMIN) {
            await manager.query(`SET LOCAL app.bypass_rls = 'on'`);
          } else {
            await manager.query(`SET LOCAL app.bypass_rls = 'off'`);
          }

          // Await the full response inside the transaction so SET LOCAL stays active
          const result = await lastValueFrom(next.handle());
          observer.next(result);
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }
}
