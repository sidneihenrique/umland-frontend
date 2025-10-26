import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';

@Component({
  selector: 'app-about',
  imports: [LucideIconsModule, CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('matrixCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('footerQuote', { static: false }) footerQuoteRef!: ElementRef<HTMLDivElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationInterval: any;
  private letters: string[] = [];
  private drops: number[] = [];
  private fontSize: number = 10;
  private columns: number = 0;
  private isBrowser: boolean;
  private observer?: IntersectionObserver;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
    
    const letterString = 'ABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZ';
    this.letters = letterString.split('');
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    
    setTimeout(() => {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      this.ctx = ctx;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      this.columns = canvas.width / this.fontSize;
      
      for (let i = 0; i < this.columns; i++) {
        if (Math.random() > 0.85) {
          this.drops[i] = Math.floor(Math.random() * -100);
        }
      }
      
      this.animationInterval = setInterval(() => this.draw(), 100);
      
      window.addEventListener('resize', () => this.handleResize());
    }, 100);

    // Setup Intersection Observer for footer quote
    setTimeout(() => {
      if (this.footerQuoteRef) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                this.observer?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.5 }
        );
        
        this.observer.observe(this.footerQuoteRef.nativeElement);
      }
    }, 100);
  }

  private draw(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, .08)';
    this.ctx.fillRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    
    for (let i = 0; i < this.drops.length; i++) {
      if (this.drops[i] !== undefined) {
        const text = this.letters[Math.floor(Math.random() * this.letters.length)];
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
        this.drops[i]++;
        
        if (this.drops[i] * this.fontSize > this.canvasRef.nativeElement.height) {
          if (Math.random() > 0.95) {
            this.drops[i] = Math.floor(Math.random() * -200);
          } else {
            delete this.drops[i];
          }
        }
      } else if (Math.random() > 0.99) {
        this.drops[i] = Math.floor(Math.random() * -100);
      }
    }
  }

  private handleResize(): void {
    if (!this.isBrowser) return;
    
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    this.columns = canvas.width / this.fontSize;
    this.drops = [];
    
    for (let i = 0; i < this.columns; i++) {
      if (Math.random() > 0.85) {
        this.drops[i] = Math.floor(Math.random() * -100);
      }
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    
    document.body.style.overflow = 'hidden';
    
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    if (this.observer) {
      this.observer.disconnect();
    }
    
    window.removeEventListener('resize', () => this.handleResize());
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
