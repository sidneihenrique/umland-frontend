import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { BackpackService, BackpackItem, BackpackData } from '../../services/backpack.service';
import { NotificationService } from '../../services/notification.service';
import { AppContextService } from '../../services/app-context.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-backpack',
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './backpack.component.html',
  styleUrl: './backpack.component.css'
})
export class BackpackComponent implements OnInit, OnDestroy {
  isOpen: boolean = false;
  backpackData: BackpackData | null = null;
  emptySlots: number[] = [];
  hoveredItem: BackpackItem | null = null;
  selectedItem: BackpackItem | null = null;
  canUseItems: boolean = false;
  tooltipTop: number = 0;
  tooltipLeft: number = 0;
  private contextSubscription?: Subscription;

  constructor(private backpackService: BackpackService,
              private notificationService: NotificationService,
              private appContextService: AppContextService
  ) {}

  ngOnInit() {
    this.loadBackpackData();
    
    this.contextSubscription = this.appContextService.contextState$.subscribe(state => {
      this.canUseItems = state.canUseItems;
    });
  }

  ngOnDestroy() {
    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }
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
    this.selectedItem = null;
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadBackpackData();
    } else {
      this.selectedItem = null;
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

  onItemHover(item: BackpackItem, event: MouseEvent) {
    this.hoveredItem = item;
    
    // Calcula a posição do tooltip baseado na posição do elemento
    const target = event.target as HTMLElement;
    const rect = target.closest('.inventory-slot')?.getBoundingClientRect();
    
    if (rect) {
      // Posiciona o tooltip à direita do item
      this.tooltipLeft = rect.right + 8;
      this.tooltipTop = rect.top;
      
      // Ajusta se estiver muito perto da borda direita da tela
      const tooltipWidth = 350;
      if (this.tooltipLeft + tooltipWidth > window.innerWidth) {
        // Coloca à esquerda do item se não couber à direita
        this.tooltipLeft = rect.left - tooltipWidth - 8;
      }
    }
  }

  onItemLeave() {
    this.hoveredItem = null;
  }

  onItemClick(item: BackpackItem) {
    this.selectedItem = item;
  }

  onUseItem() {
    if (!this.selectedItem) {
      this.notificationService.showNotification('error', 'Selecione um item primeiro.');
      return;
    }

    if (!this.canUseItems) {
      this.notificationService.showNotification('error', 'Itens só podem ser usados durante uma fase.');
      return;
    }

    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = userIdStr ? Number(userIdStr) : undefined;
    if (!userId) {
      this.notificationService.showNotification('error', 'Usuário não encontrado.');
      return;
    }

    const itemToUse = this.selectedItem;
    this.backpackService.useItem(userId, itemToUse.key).subscribe({
      next: (res) => {
        this.selectedItem = null;
        this.close();
        this.loadBackpackData();
      },
      error: (err) => {
        console.error('Erro ao usar item:', err);
        this.notificationService.showNotification('error', 'Falha ao usar o item. Tente novamente.');
      }
    });
  }
}
