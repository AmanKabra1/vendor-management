import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

// Global so any feature module can inject NotificationService without importing.
@Global()
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
