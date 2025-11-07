import { Component, AfterViewInit, ElementRef, ViewChild, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [],
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.css']
})
export class CreditsComponent implements AfterViewInit {
  @ViewChild('audioElement', { static: false }) audioElement?: ElementRef<HTMLAudioElement>;
  private animationId?: number;
  showReturnButton = false;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.startCreditsSequence();
      }, 100);
    }
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

    this.renderer.setStyle(content, 'display', 'none');

    this.renderer.setStyle(preContent, 'display', 'block');
    this.fadeIn(preContent, 2000, () => {
      setTimeout(() => {
        this.fadeOut(preContent, 2000, () => {
          if (this.audioElement?.nativeElement) {
            this.audioElement.nativeElement.play().catch(err =>
              console.log('Audio play error (requer interação do usuário):', err)
            );
          }

          this.renderer.setStyle(image, 'display', 'block');
          this.renderer.addClass(container, 'has-stars');
          const logoImg = image.querySelector('img');
          if (logoImg) {
            this.renderer.addClass(logoImg, 'animate-logo');
          }

          setTimeout(() => {
            this.renderer.setStyle(content, 'display', 'block');
            this.animateCreditsWithAcceleration(amazingCredits, content);
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

  private animateCreditsWithAcceleration(element: HTMLElement, content: HTMLElement): void {
    const viewportHeight = window.innerHeight;
    const contentHeight = element.scrollHeight;
    
    const startPosition = viewportHeight * 0.8;
    const endPosition = -(contentHeight + viewportHeight * 0.5);
    const fadeOutStart = -(contentHeight - viewportHeight * 0.3);
    
    let currentPosition = startPosition;
    let baseSpeed = 45;
    let currentSpeed = baseSpeed;
    const speedIncrement = 8;
    
    let lastSpeedUpdate = Date.now();
    let lastFrameTime = Date.now();
    
    this.renderer.setStyle(element, 'position', 'relative');
    this.renderer.setStyle(element, 'will-change', 'transform, opacity');
    this.renderer.setStyle(element, 'transform', `translate3d(0, ${startPosition}px, 0)`);
    this.renderer.setStyle(element, 'top', '0');
    this.renderer.setStyle(element, 'opacity', '1');
    
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;
      
      if (currentTime - lastSpeedUpdate >= 5000) {
        currentSpeed += speedIncrement;
        lastSpeedUpdate = currentTime;
      }
      
      currentPosition -= currentSpeed * deltaTime;
      
      this.renderer.setStyle(element, 'transform', `translate3d(0, ${currentPosition}px, 0)`);
      
      if (currentPosition <= fadeOutStart && currentPosition > endPosition) {
        const fadeProgress = (fadeOutStart - currentPosition) / (fadeOutStart - endPosition);
        const opacity = Math.max(0, 1 - fadeProgress);
        this.renderer.setStyle(element, 'opacity', opacity.toString());
      }
      
      if (currentPosition > endPosition) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.renderer.setStyle(element, 'will-change', 'auto');
        if (this.audioElement?.nativeElement) {
          this.audioElement.nativeElement.pause();
        }
        this.renderer.setStyle(content, 'display', 'none');
        this.showReturnButton = true;
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  returnToMap(): void {
    this.router.navigate(['/select-map']);
  }
}
