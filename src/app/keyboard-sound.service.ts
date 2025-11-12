import { Injectable } from '@angular/core';
import { HoverSoundService } from '../services/hover-sound.service';

export interface KeyboardSoundOptions {
  typingOnly?: boolean; // se true, só toca quando foco em input/textarea/contenteditable
  selector?: string; // seletor usado para detectar elementos que disparam som (ex.: 'input, textarea, [contenteditable="true"]')
  soundKey?: string; // chave do som no HoverSoundService (ex: 'keypress' ou 'type')
  ignoreModifierKeys?: boolean; // ignora Ctrl/Alt/Meta/Shift
  ignoreRepeat?: boolean; // ignora eventos com e.repeat === true
}

@Injectable({ providedIn: 'root' })
export class KeyboardSoundService {
  private _handler = (e: KeyboardEvent) => this.onKey(e);
  private options: KeyboardSoundOptions = {
    typingOnly: true,
    selector: 'input, textarea, [contenteditable="true"]',
    soundKey: 'type',
    ignoreModifierKeys: true,
    ignoreRepeat: true
  };
  private enabled = true;

  constructor(private hover: HoverSoundService) {}

  init(opts?: Partial<KeyboardSoundOptions>) {
    if (opts) this.options = { ...this.options, ...opts };

    // preload sound (ajuste a path conforme seu assets)
    this.hover.preload(this.options.soundKey || 'type', '/assets/sounds/type-key.wav');

    // registrar listener no documento (captura)
    document.addEventListener('keydown', this._handler, true);
  }

  dispose() {
    document.removeEventListener('keydown', this._handler, true);
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    this.hover.setEnabled(v);
  }

  private onKey(e: KeyboardEvent) {
    if (!this.enabled) return;
    try {
      // ignorar teclas modificadoras
      if (this.options.ignoreModifierKeys) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
      }
      if (this.options.ignoreRepeat && e.repeat) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // se typingOnly, certifica que o foco está em um input/textarea/contenteditable
      if (this.options.typingOnly) {
        const match = target.closest ? target.closest(this.options.selector!) : null;
        if (!match) return;
      }

      // permitir opt-out com atributo data-no-sound
      if (target.closest && target.closest('[data-no-sound]')) return;

      // tudo ok -> tocar som
      this.hover.play(this.options.soundKey || 'type');
    } catch (err) {
      // fail silently
      console.debug('keyboard-sound error', err);
    }
  }
}