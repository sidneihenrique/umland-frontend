import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import { LucideIconsModule } from '../../lucide-icons.module';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements AfterViewInit, OnDestroy {
  
  @Input() items: string[] = [];

    // NOVO: habilita mostrar o botão de leitura (default false)
  @Input() enableReadAloud: boolean = false;
  // NOVO: idioma usado pelo SpeechSynthesis (padrão pt-BR)
  @Input() readLang: string = 'pt-BR';
  // NOVO: velocidade (0.1 - 10)
  @Input() readRate: number = 1.0;
  // NOVO: pitch (0 - 2)
  @Input() readPitch: number = 1.0;

  // NOVO: nome da voz preferida (opcional)
  @Input() preferredVoiceName?: string = "Google português do Brasil 3 (Natural)";

  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  private swiper!: Swiper;

  // estado do leitor
  playing: boolean = false;
  private utterance: SpeechSynthesisUtterance | null = null;

  availableVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private _voicesChangedListener: (() => void) | null = null;

// substitua loadVoices() por ensureVoicesLoaded() (retorna promise)
  private ensureVoicesLoaded(timeoutMs: number = 2000): Promise<void> {
    const synth = (window as any).speechSynthesis;
    if (!synth) return Promise.resolve();

    // já temos vozes => resolve imediatamente
    const current = synth.getVoices();
    if (current && current.length > 0) {
      this.availableVoices = current;
      this.voicesLoaded = true;
      return Promise.resolve();
    }

    // senão, aguardar evento voiceschanged (com timeout)
    return new Promise((resolve) => {
      let done = false;

      const finish = (voices?: SpeechSynthesisVoice[]) => {
        if (done) return;
        done = true;
        this.availableVoices = (voices && voices.length > 0) ? voices : (synth.getVoices() || []);
        this.voicesLoaded = this.availableVoices.length > 0;
        // remove listener se foi registrado
        if (this._voicesChangedListener) {
          try { synth.removeEventListener('voiceschanged', this._voicesChangedListener as EventListener); } catch(e) {}
          this._voicesChangedListener = null;
        }
        resolve();
      };

      // registra listener (alguns browsers usam addEventListener)
      this._voicesChangedListener = () => {
        const got = synth.getVoices() || [];
        if (got.length > 0) finish(got);
      };

      try {
        synth.addEventListener('voiceschanged', this._voicesChangedListener as EventListener);
      } catch (e) {
        // fallback para browsers que não implementam addEventListener nesta API
        (synth as any).onvoiceschanged = this._voicesChangedListener;
      }

      // safety timeout
      setTimeout(() => finish(), timeoutMs);
    });
  }
  

  ngAfterViewInit() {
    this.swiper = new Swiper(this.swiperContainer.nativeElement, {
      modules: [Navigation, Pagination],
      slidesPerView: 1,
      autoHeight: true,
      navigation: {
        nextEl: this.swiperContainer.nativeElement.querySelector('.swiper-button-next'),
        prevEl: this.swiperContainer.nativeElement.querySelector('.swiper-button-prev')
      },
      pagination: {
        el: this.swiperContainer.nativeElement.querySelector('.swiper-pagination'),
        clickable: true
      },
      loop: false,
      allowTouchMove: false, // Desabilita arrastar/swipe
      simulateTouch: false, // Desabilita simulação de touch
      noSwiping: true, // Desabilita swipe
      noSwipingClass: 'swiper-slide' // Classe para desabilitar swipe
    });
  }

  /**
   * Lê em voz alta o texto do slide atual.
   * Se já estiver tocando, cancela a fala.
   */
  async readCurrent() {
    const synth = (window as any).speechSynthesis;
    if (!this.enableReadAloud) return;
    if (!synth) {
      console.warn('SpeechSynthesis não suportado neste navegador.');
      return;
    }

    // garante que availableVoices esteja preenchido (mas com timeout)
    await this.ensureVoicesLoaded(2500);

    if (this.playing) {
      synth.cancel();
      this.playing = false;
      this.utterance = null;
      return;
    }

    // descobrir index atual do swiper (como antes)
    const index = (this.swiper && typeof (this.swiper as any).activeIndex === 'number') ? (this.swiper as any).activeIndex : 0;
    const text = (this.items && this.items[index]) ? String(this.items[index]) : '';
    if (!text.trim()) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.readLang || 'pt-BR';
    utter.rate = this.readRate || 1.0;
    utter.pitch = this.readPitch || 1.0;

    // Escolher voz preferida:
    let voice: SpeechSynthesisVoice | undefined;
    if (this.preferredVoiceName && this.availableVoices.length) {
      const nameLower = this.preferredVoiceName.toLowerCase();
      voice = this.availableVoices.find(v => v.name.toLowerCase().includes(nameLower));
    }

    // heurística: preferir vozes "Google" em pt
    if (!voice && this.availableVoices.length) {
      voice = this.availableVoices.find(v => /google/i.test(v.name) && /^pt\b/i.test(v.lang));
    }
    // fallback: qualquer voz pt-*
    if (!voice && this.availableVoices.length) {
      voice = this.availableVoices.find(v => /^pt\b/i.test(v.lang));
    }
    // último fallback: primeira disponível
    if (!voice && this.availableVoices.length) {
      voice = this.availableVoices[0];
    }

    if (voice) utter.voice = voice;

    utter.onend = () => { this.playing = false; this.utterance = null; };
    utter.onerror = () => { this.playing = false; this.utterance = null; };

    this.utterance = utter;
    this.playing = true;
    synth.speak(utter);
  }

  ngOnDestroy() {
    try {
      const synth = (window as any).speechSynthesis;
      if (synth) {
        synth.cancel();
        // remover listener se tiver
        if (this._voicesChangedListener) {
          try { synth.removeEventListener('voiceschanged', this._voicesChangedListener as EventListener); } catch(e) {}
        }
      }
    } catch (e) { /* ignore */ }

    if (this.swiper) {
      this.swiper.destroy();
    }
  }
}
