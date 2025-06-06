import { Component, Input } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';

@Component({
  selector: 'game-phase',
  standalone: true,
  imports: [LucideIconsModule, DiagramEditorComponent],
  templateUrl: './game-phase.component.html',
  styleUrl: './game-phase.component.css'
})
export class GamePhaseComponent {
  @Input() isOpen = false;
  dicas: string[] = [];
  dicaAtual = 0;
  currentClass = 'fade-in';
  
  // Lista de dicas de UML (você pode expandir)
  todasDicas: string[] = [
    "Use casos de uso para representar funcionalidades do sistema do ponto de vista do usuário.",
    "Diagramas de classe mostram a estrutura estática do sistema com classes e relacionamentos.",
    "Herança em UML é representada por uma seta com ponta vazia (triângulo).",
    "Interfaces em UML são representadas com o estereótipo <<interface>>.",
    "Diagramas de sequência são ótimos para mostrar a interação entre objetos ao longo do tempo.",
    "Use notes (anotações) para adicionar comentários explicativos aos seus diagramas.",
    "Mantenha seus diagramas simples e focados em um aspecto específico do sistema.",
    "Diagramas de atividade são similares a fluxogramas e mostram o fluxo de processos."
  ];

  abrirDicas() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.sortearDicas();
    }
  }

  sortearDicas() {
    const dicasEmbaralhadas = [...this.todasDicas]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    this.dicas = dicasEmbaralhadas;
    this.dicaAtual = 0;
    this.currentClass = 'fade-in';
  }

  mudarDica(direcao: number) {
    this.currentClass = 'fade-out';
    
    setTimeout(() => {
      this.dicaAtual = (this.dicaAtual + direcao + this.dicas.length) % this.dicas.length;
      this.currentClass = 'fade-in';
    }, 300);
  }

  get dicaTexto() {
    return this.dicas[this.dicaAtual];
  }
}
