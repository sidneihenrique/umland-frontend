import { Component, AfterViewInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [],
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.css']
})
export class CreditsComponent implements AfterViewInit {
  @ViewChild('audioElement', { static: false }) audioElement?: ElementRef<HTMLAudioElement>;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startCreditsSequence();
    }, 100);
  }

  private startCreditsSequence(): void {
    const preContent = document.querySelector('.pre-content') as HTMLElement;
    const content = document.querySelector('.content') as HTMLElement;
    const image = document.querySelector('.image') as HTMLElement;
    const container = document.getElementById('container') as HTMLElement;
    const amazingCredits = document.querySelector('.amazing-credits') as HTMLElement;

    if (!preContent || !content || !image || !container || !amazingCredits) {
      console.error('Elementos não encontrados');
      return;
    }

    // Oculta o conteúdo inicialmente
    this.renderer.setStyle(content, 'display', 'none');

    // Mostra o pré-conteúdo
    this.renderer.setStyle(preContent, 'display', 'block');
    this.fadeIn(preContent, 2000, () => {
      setTimeout(() => {
        this.fadeOut(preContent, 2000, () => {
          // Toca o áudio se disponível
          if (this.audioElement?.nativeElement) {
            this.audioElement.nativeElement.play().catch(err => 
              console.log('Audio play error (requer interação do usuário):', err)
            );
          }

          // Mostra a logo
          this.renderer.setStyle(image, 'display', 'block');
          this.renderer.addClass(container, 'has-stars');
          const logoImg = image.querySelector('img');
          if (logoImg) {
            this.renderer.addClass(logoImg, 'animate-logo');
          }

          setTimeout(() => {
            // Mostra os créditos rolando
            this.renderer.setStyle(content, 'display', 'block');
            this.renderer.addClass(amazingCredits, 'animate');

            // Para o áudio e oculta os créditos após 87 segundos
            setTimeout(() => {
              if (this.audioElement?.nativeElement) {
                this.audioElement.nativeElement.pause();
              }
              this.renderer.setStyle(content, 'display', 'none');
            }, 87000);
          }, 6000);
        });
      }, 2000);
    });
  }

  private fadeIn(element: HTMLElement, duration: number, callback?: () => void): void {
    this.renderer.setStyle(element, 'opacity', '0');
    this.renderer.setStyle(element, 'display', 'block');
    
    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      this.renderer.setStyle(element, 'opacity', opacity.toString());
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    requestAnimationFrame(animate);
  }

  private fadeOut(element: HTMLElement, duration: number, callback?: () => void): void {
    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(1 - (progress / duration), 0);
      this.renderer.setStyle(element, 'opacity', opacity.toString());
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        this.renderer.setStyle(element, 'display', 'none');
        if (callback) {
          callback();
        }
      }
    };
    requestAnimationFrame(animate);
  }
}
