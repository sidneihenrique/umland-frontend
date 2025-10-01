import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainerComponent } from './notification/notification-container.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NotificationContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'umland-frontend';
}
