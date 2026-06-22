import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Sends transactional emails via Gmail SMTP (App Password).
 * If GMAIL_USER / GMAIL_APP_PASSWORD are not set, every method is a safe no-op
 * so the app runs fine without email configured. All sends are fire-and-forget
 * and never throw into the request path.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from = '';

  constructor() {
    const user = (process.env.GMAIL_USER || '').trim();
    // Google shows app passwords as "abcd efgh ijkl mnop" — strip any spaces.
    const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
      });
      this.from = `RideFleet <${user}>`;
      // Surface credential problems at startup instead of failing silently later.
      this.transporter
        .verify()
        .then(() => this.logger.log(`Email enabled (Gmail SMTP as ${user})`))
        .catch((e) =>
          this.logger.error(`Email NOT working — Gmail rejected the credentials: ${e.message}`),
        );
    } else {
      this.logger.warn('Email disabled — set GMAIL_USER and GMAIL_APP_PASSWORD to enable');
    }
  }

  private send(to: string, subject: string, html: string) {
    if (!this.transporter || !to) return;
    this.transporter
      .sendMail({ from: this.from, to, subject, html })
      .then(() => this.logger.log(`Email sent: "${subject}" -> ${to}`))
      .catch((e) => this.logger.error(`Email failed -> ${to}: ${e.message}`));
  }

  private wrap(title: string, body: string) {
    return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#0d6efd">📦 RideFleet</h2>
      <h3>${title}</h3>
      <p style="color:#333;line-height:1.6">${body}</p>
      <hr style="border:none;border-top:1px solid #eee">
      <small style="color:#999">This is an automated message from RideFleet.</small>
    </div>`;
  }

  welcome(to: string, name: string, role: string) {
    this.send(
      to,
      'Welcome to RideFleet',
      this.wrap(`Welcome, ${name}!`, `Your ${role.replace('_', ' ')} account is ready.${
        role === 'store_owner' || role === 'rider'
          ? ' An admin will review and approve your account shortly.'
          : ''
      }`),
    );
  }

  approved(to: string, name: string, what: string) {
    this.send(
      to,
      `Your ${what} has been approved`,
      this.wrap('You\'re approved! ✅', `Hi ${name}, your ${what} has been approved and is now active on RideFleet.`),
    );
  }

  orderAssigned(to: string, riderName: string, orderNumber: string) {
    this.send(
      to,
      `New delivery assigned: ${orderNumber}`,
      this.wrap('New delivery 🛵', `Hi ${riderName}, order <b>${orderNumber}</b> has been assigned to you. Open the Rider Hub to accept and start delivery.`),
    );
  }
}
