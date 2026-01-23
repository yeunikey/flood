import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { SpatialController } from './spatial.controller';
import { TilesClient } from './grpc/tiles.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spatial } from './entity/spatial.entity';
import { SpatialService } from './spatial.service';

@Module({
  controllers: [SpatialController],
  providers: [SpatialService, TilesClient],
  imports: [
    TypeOrmModule.forFeature([Spatial]),
    ClientsModule.register([
      {
        name: 'TILES_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'tiles',
          protoPath: join(process.cwd(), 'libs/proto/tiles.proto'),
          url: 'tiles-service:5000',
        },
      },
    ]),
  ],
})
export class SpatialModule {}
