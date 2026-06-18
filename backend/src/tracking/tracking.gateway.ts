import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface LocationPayload {
  orderId: string;
  lat: number;
  lng: number;
}

@WebSocketGateway({
  namespace: 'tracking',
  cors: { origin: true, credentials: true },
})
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  // Authenticate via the handshake JWT when present. Anonymous sockets are
  // allowed as read-only watchers (for the public customer tracking link).
  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers.authorization || '').replace('Bearer ', '');
    try {
      (client.data as any).user = token ? this.jwtService.verify(token) : null;
    } catch {
      (client.data as any).user = null;
    }
  }

  // A store/customer/rider joins an order's room to exchange live updates.
  @SubscribeMessage('joinOrder')
  joinOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(this.room(orderId));
    return { joined: orderId };
  }

  // Rider pushes GPS; relay to everyone watching this order.
  @SubscribeMessage('riderLocation')
  riderLocation(
    @MessageBody() data: LocationPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Only authenticated users may publish location; guests are read-only.
    if (!(client.data as any).user) return;
    this.server.to(this.room(data.orderId)).emit('location', {
      orderId: data.orderId,
      lat: data.lat,
      lng: data.lng,
      at: Date.now(),
    });
  }

  /** Called by OrderService whenever an order's status changes. */
  emitOrderStatus(orderId: string, status: string) {
    this.server?.to(this.room(orderId)).emit('status', { orderId, status });
  }

  private room(orderId: string) {
    return `order:${orderId}`;
  }
}
