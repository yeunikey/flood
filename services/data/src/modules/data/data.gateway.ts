import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DataService } from './data.service';
import { Socket, Server } from 'socket.io';
import { UploadChunkPayloadDto } from './dto/upload-chunk.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
export class DataGateway implements OnGatewayConnection {
  constructor(
    private readonly dataService: DataService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const token = (client.handshake.auth as { token?: unknown }).token;

    if (typeof token !== 'string') {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        id: number;
        role?: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!['admin', 'editor'].includes(payload.role ?? '')) {
        client.disconnect(true);
      }
    } catch {
      client.disconnect(true);
    }
  }

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
