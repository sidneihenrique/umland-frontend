import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'achievement';

export interface NotificationData {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  autoDismiss?: boolean;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private idCounter = 0;

  constructor() { }

  showSuccess(message: string, duration: number = 4000): string {
    return this.addNotification({
      type: 'success',
      message,
      duration,
      autoDismiss: true
    });
  }

  showError(message: string, duration: number = 6000): string {
    return this.addNotification({
      type: 'error',
      message,
      duration,
      autoDismiss: true
    });
  }

  showAchievement(message: string, duration: number = 5000): string {
    return this.addNotification({
      type: 'achievement',
      message,
      duration,
      autoDismiss: true
    });
  }

  showNotification(type: NotificationType, message: string, duration?: number): string {
    const defaultDurations = {
      'success': 4000,
      'error': 6000,
      'achievement': 5000
    };

    return this.addNotification({
      type,
      message,
      duration: duration || defaultDurations[type],
      autoDismiss: true
    });
  }

  addNotification(notification: Omit<NotificationData, 'id'>): string {
    const currentNotifications = this.notificationsSubject.value;
    const existingNotification = currentNotifications.find(n =>
      n.type === notification.type &&
      n.message === notification.message
    );

    if (existingNotification) {
      return existingNotification.id;
    }

    const id = this.generateId();
    const newNotification: NotificationData = {
      id,
      duration: 4000,
      autoDismiss: true,
      ...notification
    };

    this.notificationsSubject.next([...currentNotifications, newNotification]);

    return id;
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  getNotifications(): NotificationData[] {
    return this.notificationsSubject.value;
  }

  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
}