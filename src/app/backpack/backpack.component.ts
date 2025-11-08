import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { BackpackService, BackpackItem, BackpackData } from '../../services/backpack.service';
import { NotificationService } from '../../services/notification.service';

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

  constructor(private backpackService: BackpackService,
              private notificationService: NotificationService
  ) {}

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
    // tenta obter userId do localStorage (mesmo padrão que existe no projeto)
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    if (!userId) {
      // sem usuário: mantém comportamento anterior (vazio)
      this.backpackData = { items: [], maxSlots: 12 };
      this.calculateEmptySlots();
      return;
    }

    this.backpackService.getBackpackData(userId).subscribe({
      next: (data: BackpackData) => {
        // data já vem no shape esperado pelo template
        this.backpackData = data;
        this.calculateEmptySlots();
      },
      error: (error) => {
        this.notificationService.showNotification('error', 'Não foi possível carregar os dados da mochila.');
        // fallback: items vazios
        this.backpackData = { items: [], maxSlots: 12 };
        this.calculateEmptySlots();
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

  // Novo: usa o item via service, fecha o modal e recarrega os dados
  onUseItem(item: BackpackItem) {
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = userIdStr ? Number(userIdStr) : undefined;
    if (!userId) {
      this.notificationService.showNotification('error', 'Usuário não encontrado.');
      return;
    }

    // opcional: desabilitar UI/mostrar spinner — aqui simples subscribe
    this.backpackService.useItem(userId, item.key).subscribe({
      next: (res) => {
        // fecha modal
        this.close();

        // recarrega inventário para refletir nova quantidade
        this.loadBackpackData();

        // notificação
        this.notificationService.showNotification('success', `${item.name} utilizado.`);
      },
      error: (err) => {
        console.error('Erro ao usar item:', err);
        this.notificationService.showNotification('error', 'Falha ao usar o item. Tente novamente.');
      }
    });
  }
}
