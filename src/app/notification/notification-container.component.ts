import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationComponent } from './notification.component';
import { NotificationService, NotificationData } from './notification.service';

@Component({
  selector: 'app-notification-container',
  imports: [CommonModule, NotificationComponent],
  template: `
    <div class="notification-container-wrapper">
      <app-notification
        *ngFor="let notification of notifications; trackBy: trackByNotificationId; let i = index"
        [type]="notification.type"
        [message]="notification.message"
        [duration]="notification.duration || 4000"
        [autoDismiss]="notification.autoDismiss !== false"
        [isVisible]="true"
        (dismissed)="onNotificationDismissed(notification.id)"
        [style.margin-bottom.px]="8"
        class="notification-item">
      </app-notification>
    </div>
  `,
  styles: [`
    .notification-container-wrapper {
      position: fixed;
      top: 20px;
      right: 20px;
      pointer-events: none;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }

    .notification-item {
      pointer-events: all;
      position: relative;
    }
  `]
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  notifications: NotificationData[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onNotificationDismissed(id: string) {
    this.notificationService.removeNotification(id);
  }

  trackByNotificationId(index: number, notification: NotificationData): string {
    return notification.id;
  }
}