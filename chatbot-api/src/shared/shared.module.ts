import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { TenantContextInterceptor } from './interceptors/tenant-context.interceptor';
import { RedisProvider } from './redis/redis.provider';
import { RedisHealthIndicator } from './redis/redis-health.indicator';

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (dataSource: DataSource) => new TenantContextInterceptor(dataSource),
      inject: [getDataSourceToken()],
    },
    RedisProvider,
    RedisHealthIndicator,
  ],
  exports: [RedisProvider, RedisHealthIndicator],
})
export class SharedModule {}
