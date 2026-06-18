import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { AuthUser } from '../auth/current-user.decorator';

/**
 * AI support assistant powered by Groq (free tier, Llama 3.3 70B).
 * Falls back to a helpful canned reply when GROQ_API_KEY is not configured.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private groq: Groq | null = null;
  private readonly model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({ apiKey });
      this.logger.log('AI chat enabled (Groq)');
    } else {
      this.logger.warn('AI chat disabled — set GROQ_API_KEY to enable');
    }
  }

  private systemPrompt(user: AuthUser) {
    return [
      'You are RideFleet Assistant, a concise, friendly in-app support agent for a shared delivery-rider platform.',
      `The current user is "${user?.email}" with role "${user?.role}".`,
      'Platform facts: Store owners create delivery orders and hire nearby available riders. Riders accept orders, pick up, and deliver with a 4-digit OTP. SuperAdmin approves stores and riders. Customers track orders live via a public link.',
      'Guide users on: creating/tracking orders, finding & assigning riders, rider availability & going live, approvals, and navigating their dashboard.',
      'Keep answers short (2-4 sentences). If asked something off-topic, politely steer back to RideFleet.',
    ].join(' ');
  }

  async reply(message: string, user: AuthUser): Promise<{ reply: string }> {
    if (!this.groq) {
      return {
        reply:
          "AI assistant isn't configured yet. Tip: Store owners create an order then 'Find rider' to assign; riders Accept → Pick up → Deliver with the OTP; admins approve stores & riders from the console.",
      };
    }
    try {
      const res = await this.groq.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: 'system', content: this.systemPrompt(user) },
          { role: 'user', content: message },
        ],
      });
      return { reply: res.choices[0]?.message?.content?.trim() || 'Sorry, I had trouble answering that.' };
    } catch (e: any) {
      this.logger.error(`Groq error: ${e.message}`);
      return { reply: 'The assistant is temporarily unavailable. Please try again.' };
    }
  }
}
