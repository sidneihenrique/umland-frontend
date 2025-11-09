import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

@Component({
    selector: 'app-tips-carousel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tips-carousel.component.html',
    styleUrls: ['./tips-carousel.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class TipsCarouselComponent implements AfterViewInit, OnDestroy {

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
                clickable: true,
                dynamicBullets: false
            },
            loop: true
        });
    }

    ngOnDestroy() {
        if (this.swiper) {
            this.swiper.destroy();
        }
    }
}
