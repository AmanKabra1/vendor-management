import { Component } from '@angular/core';
import { ApiService } from './api.service';

interface ChatMsg {
  from: 'me' | 'bot';
  text: string;
}

@Component({
  selector: 'app-chat-widget',
  standalone: false,
  template: `
    <!-- Launcher -->
    <button class="chat-fab" (click)="toggle()" *ngIf="!open" title="Ask RideFleet Assistant">
      💬
    </button>

    <!-- Panel -->
    <div class="chat-panel" *ngIf="open">
      <div class="chat-head">
        <span class="d-flex align-items-center gap-2">
          <span class="bot-dot"></span> RideFleet Assistant
        </span>
        <button class="btn-close-x" (click)="toggle()">✕</button>
      </div>

      <div class="chat-body" #body>
        <div *ngIf="!messages.length" class="text-muted small text-center mt-3">
          Hi! Ask me anything about creating orders, hiring riders, deliveries or approvals.
        </div>
        <div *ngFor="let m of messages" class="msg" [class.me]="m.from==='me'">
          <div class="bubble" [class.bubble-me]="m.from==='me'">{{ m.text }}</div>
        </div>
        <div *ngIf="loading" class="msg"><div class="bubble typing">…</div></div>
      </div>

      <form class="chat-input" (ngSubmit)="send()">
        <input class="form-control" [(ngModel)]="draft" name="draft" placeholder="Type a message…" autocomplete="off" />
        <button class="btn btn-primary" [disabled]="loading || !draft.trim()">➤</button>
      </form>
    </div>
  `,
  styles: [
    `.chat-fab { position: fixed; right: 22px; bottom: 22px; width: 56px; height: 56px; border-radius: 50%; border: none;
       background: var(--rf-grad); color: #fff; font-size: 24px; box-shadow: 0 10px 26px rgba(76,29,149,.45); z-index: 1080; cursor: pointer; transition: transform .15s ease; }`,
    `.chat-fab:hover { transform: scale(1.08) translateY(-2px); }`,
    `.chat-panel { position: fixed; right: 22px; bottom: 22px; width: 360px; max-width: calc(100vw - 32px); height: 480px; max-height: calc(100vh - 40px);
       background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(20,10,50,.3); display: flex; flex-direction: column; overflow: hidden; z-index: 1080; animation: rf-rise .25s ease both; }`,
    `.chat-head { background: var(--rf-grad); color: #fff; padding: 14px 16px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }`,
    `.bot-dot { width: 9px; height: 9px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,.3); }`,
    `.btn-close-x { background: none; border: none; color: #fff; opacity: .85; cursor: pointer; font-size: 14px; }`,
    `.chat-body { flex: 1; overflow-y: auto; padding: 14px; background: #f7f7fb; }`,
    `.msg { display: flex; margin-bottom: 8px; }`,
    `.msg.me { justify-content: flex-end; }`,
    `.bubble { max-width: 80%; padding: 9px 13px; border-radius: 14px; background: #fff; border: 1px solid #eee; font-size: .9rem; line-height: 1.45; white-space: pre-wrap; }`,
    `.bubble-me { background: var(--rf-grad); color: #fff; border: none; }`,
    `.typing { letter-spacing: 2px; }`,
    `.chat-input { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; }`,
    `.chat-input .btn { border-radius: 10px; }`,
  ],
})
export class ChatWidgetComponent {
  open = false;
  draft = '';
  loading = false;
  messages: ChatMsg[] = [];

  constructor(private api: ApiService) {}

  toggle() {
    this.open = !this.open;
  }

  send() {
    const text = this.draft.trim();
    if (!text || this.loading) return;
    this.messages.push({ from: 'me', text });
    this.draft = '';
    this.loading = true;
    this.api.post('chat/message', { message: text }).subscribe({
      next: (r: any) => {
        this.messages.push({ from: 'bot', text: r.reply });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ from: 'bot', text: 'Sorry, something went wrong.' });
        this.loading = false;
      },
    });
  }
}
