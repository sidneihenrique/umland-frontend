import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-advise-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advise-modal.component.html',
  styleUrl: './advise-modal.component.css'
})
export class AdviseModalComponent {
  @Input() visible: boolean = false;
  @Input() title?: string = '';
  @Input() description?: string = '';
  @Input() videoSrc?: string = '';

  hide() {
    this.visible = false;
  }
}
