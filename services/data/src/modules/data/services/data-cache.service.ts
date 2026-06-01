import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { DATA_STATS_CACHE_KEY } from '../data.constants';

@Injectable()
export class DataCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getOrSet<T>(
    key: string,
    ttl: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cacheManager.get<T>(key);

    if (cached) {
      return cached;
    }

    const value = await factory();
    await this.cacheManager.set(key, value, ttl);

    return value;
  }

  async clearStats(): Promise<void> {
    await this.cacheManager.del(DATA_STATS_CACHE_KEY);
  }
}
