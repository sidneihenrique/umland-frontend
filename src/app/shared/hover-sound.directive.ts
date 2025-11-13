
import { Directive, Input, HostListener, OnInit } from '@angular/core';
import { HoverSoundService } from '../../services/hover-sound.service';

@Directive({
  selector: '[appHoverSound]'
})
export class HoverSoundDirective implements OnInit {
  @Input('appHoverSound') soundKey: string = 'hover'; // key to play
  constructor(private svc: HoverSoundService) {}

  ngOnInit() {
    // Assuming you preloaded sounds globally in AppComponent or service
  }

  @HostListener('mouseenter')
  onEnter() {
    this.svc.play(this.soundKey);
  }

  // also play on keyboard focus for accessibility
  @HostListener('focus')
  onFocus() {
    this.svc.play(this.soundKey);
  }
}