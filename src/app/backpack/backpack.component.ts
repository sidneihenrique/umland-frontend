import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { BackpackService, BackpackItem, BackpackData } from '../../services/backpack.service';

@Component({
  selector: 'app-backpack',
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './backpack.component.html',
  styleUrl: './backpack.component.css'
})
export class BackpackComponent implements OnInit {
  isOpen: boolean = false;
  backpackData: BackpackData | null = null;
  emptySlots: number[] = [];
  hoveredItem: BackpackItem | null = null;

  constructor(private backpackService: BackpackService) {}

  ngOnInit() {
    this.loadBackpackData();
  }

  show() {
    this.isOpen = true;
    this.loadBackpackData()
  }

  hide() {
    this.isOpen = false;
  }

  close() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadBackpackData();
    }
  }

  private loadBackpackData() {
    this.backpackService.getBackpackData().subscribe({
      next: (data: BackpackData) => {
        this.backpackData = data;
        this.calculateEmptySlots();
      },
      error: (error) => {
        console.error('Erro ao carregar dados da mochila:', error);
      }
    });
  }

  private calculateEmptySlots() {
    if (this.backpackData) {
      const usedSlots = this.backpackData.items.length;
      const emptySlotCount = this.backpackData.maxSlots - usedSlots;
      this.emptySlots = Array(emptySlotCount).fill(0).map((_, index) => index);
    }
  }

  onItemHover(item: BackpackItem) {
    this.hoveredItem = item;
  }

  onItemLeave() {
    this.hoveredItem = null;
  }
}
