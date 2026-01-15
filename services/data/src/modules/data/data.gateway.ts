import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DataService } from './data.service';
import { Socket, Server } from 'socket.io';

interface DataRowDto {
  siteId: number;
  variables: (number | null)[];
  values: any[];
  date_utc: string;
}

interface UploadChunkPayloadDto {
  qclId: number;
  sourceId: number;
  methodId: number;
  categoryId: number;
  chunks: DataRowDto[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
export class DataGateway {
  constructor(private readonly dataService: DataService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('upload_chunk')
  async handleUploadChunk(
    @MessageBody() data: UploadChunkPayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.dataService.uploadChunk(data);
      client.emit('upload_ack', { status: 200 });
    } catch {
      client.emit('upload_ack', { status: 500 });
    }
  }
}
