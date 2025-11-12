import { Component, OnInit, OnDestroy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainerComponent } from './notification/notification-container.component';
import { KeyboardSoundService } from './keyboard-sound.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NotificationContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy{
  constructor(private kbSound: KeyboardSoundService) {}
  title = 'umland-frontend';
  ngOnInit() {
    // inicializa som de teclado no app (typingOnly true)
    this.kbSound.init({ typingOnly: true, soundKey: 'type' });
  }
  ngOnDestroy() {
    this.kbSound.dispose();
  }
}
