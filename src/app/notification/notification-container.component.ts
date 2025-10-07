import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationData } from '../../services/notification.service';
import { NotificationComponent } from './notification.component';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './notification-container.component.html',
  styleUrl: './notification-container.component.css'
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  toastNotifications: NotificationData[] = [];
  snackbarNotifications: NotificationData[] = [];
  
  private notificationSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationSubscription = this.notificationService.notifications$.subscribe(
      (notifications: NotificationData[]) => {
        // Separar notificações entre toast (success, error) e snackbar (achievement)
        this.toastNotifications = notifications.filter(n => n.type !== 'achievement');
        this.snackbarNotifications = notifications.filter(n => n.type === 'achievement');
      }
    );
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  onNotificationDismissed(notificationId: string) {
    this.notificationService.removeNotification(notificationId);
  }

  trackByNotificationId(index: number, notification: NotificationData): string {
    return notification.id;
  }
}