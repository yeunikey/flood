import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { TilesGrpcService, Tile } from './tile.grpc';

@Injectable()
export class TilesClient implements OnModuleInit {
  private readonly logger = new Logger(TilesClient.name);
  private tilesService: TilesGrpcService;

  constructor(@Inject('TILES_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.tilesService =
      this.client.getService<TilesGrpcService>('TilesService');
  }

  async getTilesByIds(ids: string[]): Promise<Tile[]> {
    if (!ids.length) return [];

    try {
      this.logger.debug(`[gRPC] Requesting tiles: ${ids.join(', ')}`);

      const response = await lastValueFrom(this.tilesService.findMany({ ids }));

      return response.tiles || [];
    } catch {
      this.logger.error(`[gRPC] Error fetching tiles`);
      return [];
    }
  }
}
