import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

export interface LiveLocation {
  orderId: string;
  lat: number;
  lng: number;
  at: number;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private socket?: Socket;
  private readonly url = 'http://localhost:3000/tracking';

  constructor(private auth: AuthService) {}

  private connect(): Socket {
    if (this.socket?.connected) return this.socket;
    this.socket = io(this.url, {
      auth: { token: this.auth.token },
      transports: ['websocket'],
    });
    return this.socket;
  }

  /** Join an order room to send/receive live updates. */
  joinOrder(orderId: string) {
    this.connect().emit('joinOrder', orderId);
  }

  /** Rider: push current GPS to watchers of this order. */
  sendLocation(orderId: string, lat: number, lng: number) {
    this.connect().emit('riderLocation', { orderId, lat, lng });
  }

  onLocation(cb: (loc: LiveLocation) => void) {
    this.connect().on('location', cb);
  }

  onStatus(cb: (s: { orderId: string; status: string }) => void) {
    this.connect().on('status', cb);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
