import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: FactoryProvider<Redis> = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const url = config.get<string>('REDIS_URL')!;
    const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    return client;
  },
};
