import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tutorial-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './tutorial-modal.component.html',
  styleUrl: './tutorial-modal.component.css'
})
export class TutorialModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() videoSrc?: string | null;
  @Output() visibleChange = new EventEmitter<boolean>();

  // safe URL para o iframe
  public safeVideoUrl: SafeResourceUrl | null = null;

  // botão inicialmente desabilitado por X ms quando o modal abre
  public isButtonDisabled: boolean = false;
  private _disableTimerRef: any = null;
  private readonly BUTTON_DISABLE_MS = 5000;

  // checkbox "Não mostrar novamente"
  public dontShowAgain: boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['videoSrc']) {
      this.updateSafeUrl();
    }
    // quando modal abrir, inicia o timer do botão
    if (changes['visible']) {
      const nowVisible = !!changes['visible'].currentValue;
      if (nowVisible) {
        this.onOpen();
      } else {
        // se fechou, limpa possíveis timers
        this.clearDisableTimer();
      }
    }
  }

  private updateSafeUrl() {
    if (!this.videoSrc) {
      this.safeVideoUrl = null;
      return;
    }

    const embed = this.toEmbedUrl(this.videoSrc);
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  // Converte várias formas de URL do YouTube para a URL de embed
  private toEmbedUrl(src: string): string {
    const s = String(src).trim();

    if (s.includes('youtube.com/embed/')) {
      return this.addParams(s);
    }

    const ytWatch = s.match(/[?&]v=([^&]+)/);
    if (ytWatch && ytWatch[1]) {
      return this.addParams(`https://www.youtube.com/embed/${ytWatch[1]}`);
    }

    const youtu = s.match(/youtu\.be\/([^?&]+)/);
    if (youtu && youtu[1]) {
      return this.addParams(`https://www.youtube.com/embed/${youtu[1]}`);
    }

    if (/^[\w-]{6,}$/.test(s)) {
      return this.addParams(`https://www.youtube.com/embed/${s}`);
    }

    return this.addParams(s);
  }

  private addParams(base: string) {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}rel=0&modestbranding=1&enablejsapi=1`;
  }

  // chamado quando modal abre
  private onOpen() {
    // reset checkbox state each open
    this.dontShowAgain = false;

    // desabilita o botão por BUTTON_DISABLE_MS e aplica classe (template faz isso via isButtonDisabled)
    this.isButtonDisabled = true;
    this.clearDisableTimer();
    this._disableTimerRef = setTimeout(() => {
      this.isButtonDisabled = false;
      this._disableTimerRef = null;
    }, this.BUTTON_DISABLE_MS);
  }

  private clearDisableTimer() {
    if (this._disableTimerRef) {
      clearTimeout(this._disableTimerRef);
      this._disableTimerRef = null;
    }
  }

  // fechar: se checkbox marcado, grava localStorage; sempre emite visibleChange
  hide() {
    // grava preferência apenas se marcada
    try {
      if (this.dontShowAgain) {
        localStorage.setItem('dontShowTutorialAnymore', '1');
      }
    } catch (e) {
      // ignore storage errors
    }

    this.clearDisableTimer();
    this.visible = false;
    this.visibleChange.emit(false);
  }
}