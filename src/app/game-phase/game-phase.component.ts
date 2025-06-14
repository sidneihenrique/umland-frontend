import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { Navigation } from 'swiper/modules';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'game-phase',
  standalone: true,
  imports: [LucideIconsModule, DiagramEditorComponent, CommonModule],
  templateUrl: './game-phase.component.html',
  styleUrl: './game-phase.component.css'
})
export class GamePhaseComponent {
  isOpen = false;

  // Todas as dicas possíveis
  private todasDicas: string[] = [
    "Use casos de uso para representar funcionalidades do sistema do ponto de vista do usuário.",
    "Diagramas de classe mostram a estrutura estática do sistema com classes e relacionamentos.",
    "Herança em UML é representada por uma seta com ponta vazia (triângulo).",
    "Interfaces em UML são representadas com o estereótipo <<interface>>.",
    "Diagramas de sequência são ótimos para mostrar a interação entre objetos ao longo do tempo.",
    "Use notes (anotações) para adicionar comentários explicativos aos seus diagramas.",
    "Mantenha seus diagramas simples e focados em um aspecto específico do sistema.",
    "Diagramas de atividade são similares a fluxogramas e mostram o fluxo de processos."
  ];

  dicas: string[] = [];

  activeSlideIndex = 0;
  private swiper?: Swiper;

  constructor() {
    this.dicas = this.sortearDicas(3);
  }

  private sortearDicas(qtd: number): string[] {
    // Embaralha o array e pega os primeiros 'qtd'
    return this.todasDicas
      .map(dica => ({ dica, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, qtd)
      .map(obj => obj.dica);
  }

  toggleDicas() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Timeout para garantir que o DOM esteja atualizado
      setTimeout(() => this.initSwiper(), 0);
    } else {
      this.destroySwiper();
    }
  }

  private initSwiper() {
    // Destrói qualquer instância existente
    this.destroySwiper();

    // Configuração do Swiper
    this.swiper = new Swiper('.clues-swiper', {
      modules: [Navigation],
      slidesPerView: 1,
      spaceBetween: 10,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      on: {
        slideChange: (swiper) => {
          this.activeSlideIndex = swiper.activeIndex;
        },
        init: (swiper) => {
          this.activeSlideIndex = swiper.activeIndex;
        }
      }
    });
  }

  private destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = undefined;
    }
  }

  ngOnDestroy() {
    this.destroySwiper();
  }
}