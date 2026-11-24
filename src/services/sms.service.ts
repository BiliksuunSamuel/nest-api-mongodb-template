import { Injectable, Logger } from '@nestjs/common';
import configuration from 'src/configuration';

// Sends text messages (sign-in codes). Plug your SMS provider (Twilio, Hubtel,
// Africa's Talking, ...) into `deliver`. Until one is wired in, messages are
// written to the log outside production so the OTP flow can be tested locally;
// in production they are dropped with an error instead, so codes never leak
// into logs.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(to: string, message: string): Promise<void> {
    if (await this.deliver(to, message)) return;
    if (configuration().isProduction) {
      this.logger.error(
        `No SMS provider configured: message to ${to} was not sent`,
      );
      return;
    }
    this.logger.warn(`[dev SMS] to ${to}: ${message}`);
  }

  // Returns true once the provider accepted the message.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async deliver(to: string, message: string): Promise<boolean> {
    return false;
  }
}
