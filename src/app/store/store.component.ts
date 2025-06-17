import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { StoreItemComponent } from "../store-item/store-item.component";
import { DataService, User } from '../../services/data.service';

interface StoreItem {
  imageUrl: string;
  title: string;
  description: string;
  price: number;
  key: 'watch' | 'bomb' | 'eraser' | 'lamp';
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, StoreItemComponent],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css'
})
export class StoreComponent implements OnInit {
  visible: boolean = false;
  userMoney: number = 0;
  private userInventory: { [key: string]: number } = {};

  constructor(
    private dataService: DataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.loadUserData();
      }
    }
  }

  private loadUserData() {
    const userJson = localStorage.getItem('user');
    const inventoryJson = localStorage.getItem('inventory');
    if (userJson && inventoryJson) {
      const userData = JSON.parse(userJson);
      this.userMoney = userData.money;
      this.userInventory = JSON.parse(inventoryJson);
    }
  }

  storeItems: StoreItem[] = [
    {
      imageUrl: '/assets/store/watch.png',
      title: 'TEMPO EXTRA',
      description: 'Adicione +60 segundos à sua fase atual. Ideal para quando o tempo está apertado!',
      price: 21,
      key: 'watch'
    },
    {
      imageUrl: '/assets/store/bomb.png',
      title: 'EXPLOSÃO DE ERROS',
      description: 'Revele rapidamente todos os pontos críticos do diagrama. Use com sabedoria!',
      price: 21,
      key: 'bomb'
    },
    {
      imageUrl: '/assets/store/eraser.png',
      title: 'LIMPEZA INTELIGENTE',
      description: 'Remove elementos corretos para que você foque apenas nos erros',
      price: 21,
      key: 'eraser'
    },
    {
      imageUrl: '/assets/store/lamp.png',
      title: 'IDEIA BRILHANTE',
      description: 'Receba uma dica certeira baseada na estrutura do seu diagrama.',
      price: 21,
      key: 'lamp'
    }
  ];

  show() {
    this.loadUserData(); // Recarrega os dados quando a loja é aberta
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  toggle() {
    if (!this.visible) {
      this.loadUserData();
    }
    this.visible = !this.visible;
  }

  onBuy(item: StoreItem) {
    if (this.userMoney >= item.price) {
      const userJson = localStorage.getItem('user');
      const inventoryJson = localStorage.getItem('inventory');
      if (userJson && inventoryJson) {
        const userData = JSON.parse(userJson);
        const inventory = JSON.parse(inventoryJson);
        
        // Atualiza o dinheiro do usuário
        userData.money -= item.price;
        this.userMoney = userData.money;
        
        // Atualiza o inventário
        inventory[item.key] = (inventory[item.key] || 0) + 1;
        this.userInventory = inventory;
        
        // Salva as alterações usando o DataService
        this.dataService.updateUserData(userData);
        localStorage.setItem('inventory', JSON.stringify(inventory));
      }
    }
  }

  onUse(item: StoreItem) {
    if (this.userInventory[item.key] > 0) {
      const inventoryJson = localStorage.getItem('inventory');
      if (inventoryJson) {
        const inventory = JSON.parse(inventoryJson);
        inventory[item.key]--;
        this.userInventory = inventory;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        
        // Aqui você pode adicionar a lógica específica para cada item
        switch (item.key) {
          case 'watch':
            // Adicionar tempo extra
            break;
          case 'bomb':
            // Revelar erros
            break;
          case 'eraser':
            // Limpar elementos corretos
            break;
          case 'lamp':
            // Mostrar dica
            break;
        }
      }
    }
  }
}
