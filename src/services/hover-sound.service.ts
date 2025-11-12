// hover-sound.service.ts
// Coloque em src/app/services/hover-sound.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HoverSoundService {
  private audioMap = new Map<string, HTMLAudioElement>();
  private enabled = true; // allow global on/off
  private volume = 0.18; // sensible default

  constructor() {}

  // preload single or multiple
  preload(key: string, url: string) {
    if (this.audioMap.has(key)) return;
    const a = new Audio(url);
    a.preload = 'auto';
    a.volume = this.volume;
    // small optimization: a.muted = true until user gesture? we rely on user interaction policy.
    this.audioMap.set(key, a);
  }

  play(key: string) {
    if (!this.enabled) return;
    const audio = this.audioMap.get(key);
    if (!audio) return;
    // reset playback so short sounds restart
    try {
      audio.currentTime = 0;
    } catch (e) {}
    // calling play may be blocked until user gesture (browsers) — that's normal
    audio.play().catch(err => {
      // ignore or log; sound may be blocked until user interacts with page
      // console.debug('sound play blocked', err);
    });
  }

  setEnabled(v: boolean) { this.enabled = v; }
  isEnabled() { return this.enabled; }
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.audioMap.forEach(a => a.volume = this.volume);
  }
}