import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements AfterViewInit, OnDestroy {
  
  @Input() items: string[] = [];

  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  private swiper!: Swiper;
  

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

  ngOnDestroy() {
    if (this.swiper) {
      this.swiper.destroy();
    }
  }
}
