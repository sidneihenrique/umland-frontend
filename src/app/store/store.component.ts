import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { StoreItemComponent } from "./store-item/store-item.component";
import { DataService } from '../../services/data.service';
import { StorageService } from '../../services/storage.service';
import { User, UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

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
export class StoreComponent implements OnInit, OnDestroy {
  visible: boolean = false;
  userMoney: number = 0;
  userData?: User;
  private userInventory: { [key: string]: number } = {};
  private userDataSubscription?: Subscription;
  @Output() storeStateChanged = new EventEmitter<boolean>();
  
  constructor(
    private dataService: DataService,
    private storageService: StorageService,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.loadUserData(userId);
        this.subscribeToUserData();
      }
    }
  }

  ngOnDestroy() {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  private subscribeToUserData() {
    this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
      if (userData) {
        this.userData = userData;
        this.userMoney = userData.coins;
      }
    });
  }

  private loadUserData(userId: string) {
    this.userService.getUserById(Number(userId)).subscribe({
      next: (response: User) => {
        this.userData = response;
        this.userMoney = response.coins;
        this.dataService.updateUserData(response);
        this.loadInventory();
      },
      error: (error) => {
        console.error('Erro ao carregar dados do usuário:', error);
        // Fallback para dados do localStorage se houver erro na API
        this.loadUserDataFromStorage();
      }
    });
  }

  private loadUserDataFromStorage() {
    const userJson = localStorage.getItem('user');
    const inventoryJson = localStorage.getItem('inventory');
    if (userJson && inventoryJson) {
      const userData = JSON.parse(userJson);
      this.userData = userData;
      this.userMoney = userData.coins || userData.money || 0; // Compatibilidade com diferentes nomes de campo
      this.userInventory = JSON.parse(inventoryJson);
    }
  }

  private loadInventory() {
    if (isPlatformBrowser(this.platformId)) {
      const inventoryJson = localStorage.getItem('inventory');
      if (inventoryJson) {
        this.userInventory = JSON.parse(inventoryJson);
      }
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
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.loadUserData(userId); // Recarrega os dados quando a loja é aberta
      }
    }
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
    this.storeStateChanged.emit(this.visible);
    if (this.visible && isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.loadUserData(userId);
      }
    }
  }

  onBuy(item: StoreItem) {
    if (!this.userData || this.userMoney < item.price) {
      console.warn('Moedas insuficientes para comprar o item');
      return;
    }

    const newCoinsAmount = this.userMoney - item.price;
    
    // Atualiza as moedas no backend
    this.userService.updateUserCoins(this.userData.id, newCoinsAmount).subscribe({
      next: (updatedUser: User) => {
        // Atualiza os dados locais
        this.userData = updatedUser;
        this.userMoney = updatedUser.coins;
        
        // Atualiza o inventário
        this.updateInventory(item.key);
        
        // Notifica outros componentes sobre a mudança
        this.dataService.updateUserData(updatedUser);
        
        console.log(`Item ${item.title} comprado com sucesso!`);
      },
      error: (error) => {
        console.error('Erro ao atualizar moedas no backend:', error);
        // Em caso de erro, ainda atualiza localmente como fallback
        this.updateLocalUserData(item);
      }
    });
  }

  private updateInventory(itemKey: string) {
    if (isPlatformBrowser(this.platformId)) {
      const inventoryJson = localStorage.getItem('inventory');
      let inventory = inventoryJson ? JSON.parse(inventoryJson) : {};
      
      inventory[itemKey] = (inventory[itemKey] || 0) + 1;
      this.userInventory = inventory;
      
      localStorage.setItem('inventory', JSON.stringify(inventory));
      this.storageService.updateInventory(inventory);
    }
  }

  private updateLocalUserData(item: StoreItem) {
    if (this.userData && isPlatformBrowser(this.platformId)) {
      // Atualiza dados locais como fallback
      this.userData.coins -= item.price;
      this.userMoney = this.userData.coins;
      
      // Salva no localStorage
      localStorage.setItem('user', JSON.stringify(this.userData));
      
      // Atualiza inventário
      this.updateInventory(item.key);
      
      // Notifica outros componentes
      this.dataService.updateUserData(this.userData);
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
