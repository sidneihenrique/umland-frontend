import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-store-item',
  imports: [],
  templateUrl: './store-item.component.html',
  styleUrl: './store-item.component.css',
  standalone: true
})
export class StoreItemComponent {
  @Input() imageUrl!: string;
  @Input() title!: string;
  @Input() description!: string;
  @Input() price!: number;

  @Output() buy = new EventEmitter<void>();
  @Output() use = new EventEmitter<void>();

  onBuy() {
    this.buy.emit();
  }

  onUse() {
    this.use.emit();
  }
}
