import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';

export type NotificationType = 'success' | 'error' | 'achievement';

@Component({
  selector: 'app-notification',
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  @Input() type: NotificationType = 'success';
  @Input() message: string = '';
  @Input() duration: number = 4000;
  @Input() autoDismiss: boolean = true;
  @Input() isVisible: boolean = false;

  @Output() dismissed = new EventEmitter<void>();
  @Output() refreshTimer = new EventEmitter<void>();

  private timeoutId?: number;

  ngOnInit() {
    if (this.autoDismiss && this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close() {
    this.isVisible = false;
    this.dismissed.emit();
  }

  show() {
    this.isVisible = true;
    this.startTimer();
  }

  refresh() {
    this.startTimer();
  }

  private startTimer() {
    if (this.autoDismiss && this.duration > 0) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }
}
