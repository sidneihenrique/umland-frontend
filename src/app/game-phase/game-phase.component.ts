import { Component, AfterViewInit, ViewChild, OnInit } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { Navigation } from 'swiper/modules';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { AppComponent } from "../app.component";
import { StoreComponent } from "../store/store.component";

@Component({
  selector: 'game-phase',
  standalone: true,
  imports: [LucideIconsModule, DiagramEditorComponent, CommonModule, StoreComponent],
  templateUrl: './game-phase.component.html',
  styleUrl: './game-phase.component.css'
})
export class GamePhaseComponent implements OnInit{
  isOpen = false;
  @ViewChild(StoreComponent) store!: StoreComponent;
  

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

  // Mensagens do balão de fala
  dialogo: string[] = [
    "Olá! Como posso te ajudar hoje?",
    "Lembre-se de revisar os conceitos básicos antes de começar.",
    "Você pode navegar pelas dicas usando os botões de seta."
  ];

  dicas: string[] = [];

  activeSlideIndex = 0;
  private swiper?: Swiper;

  isSpeaking = false;
  activeSpeechIndex = 0;
  characterState = 'hidden';

  constructor() {
    this.dicas = this.sortearDicas(3);
  }
  
  ngOnInit() {
    this.toggleSpeech()
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

  toggleStore() {
    this.store.toggle();
  }

  toggleSpeech() {
    this.isSpeaking = !this.isSpeaking;
    this.characterState = this.isSpeaking ? 'visible' : 'hidden';
    if (this.isSpeaking) {
      this.activeSlideIndex = 0;
    }
  }

  nextMessage() {
    if (this.activeSlideIndex < this.dialogo.length - 1) {
      this.activeSlideIndex++;
    } else {
      // Última mensagem - fecha o balão
      this.isSpeaking = false;
      setTimeout(() => {
        this.characterState = 'hidden';
        this.activeSlideIndex = 0;
      }, 300); // Tempo para a animação de fadeOut
    }
  }

  prevMessage() {
    this.activeSlideIndex = Math.max(0, this.activeSlideIndex - 1);
  }

  get isLastMessage(): boolean {
    return this.activeSlideIndex === this.dialogo.length - 1;
  }

}