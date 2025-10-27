import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { StoreItemComponent } from "./store-item/store-item.component";
import { DataService } from '../../services/data.service';
import { StorageService } from '../../services/storage.service';
import { User, UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

interface StoreItem {
  imageUrl: string;
  title: string;
  description: string;
  price: number;
  key: 'watch' | 'bomb' | 'eraser' | 'lamp' | 'ice' | '2xtime' | '2xrepu';
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
    private notificationService: NotificationService,
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
      this.userMoney = userData.coins || userData.money || 0;
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
      imageUrl: '/assets/store/ice.png',
      title: 'CONGELAMENTO',
      description: 'Congele o tempo da fase atual e resolva os desafios sem pressão!',
      price: 200,
      key: 'ice'
    },
    {
      imageUrl: '/assets/store/2xtime.png',
      title: 'TEMPO DUPLICADO',
      description: 'Duplique todo o tempo disponível na fase atual para uma experiência mais tranquila!',
      price: 100,
      key: '2xtime'
    },
    {
      imageUrl: '/assets/store/2xrepu.png',
      title: 'REPUTAÇÃO EM DOBRO',
      description: 'Ganhe o dobro de reputação ao completar a fase. Suba de nível mais rápido!',
      price: 300,
      key: '2xrepu'
    }
  ];

  show() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.userService.getUserById(Number(userId)).subscribe({
          next: (response: User) => {
            this.userData = response;
            this.userMoney = response.coins;
            this.dataService.updateUserData(response);
          },
          error: (error) => {
            console.error('Erro ao carregar dados do usuário:', error);
          }
        });
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
        this.userService.getUserById(Number(userId)).subscribe({
          next: (response: User) => {
            this.userData = response;
            this.userMoney = response.coins;
            this.dataService.updateUserData(response);
          },
          error: (error) => {
            console.error('Erro ao carregar dados do usuário:', error);
          }
        });
      }
    }
  }

  onBuy(item: StoreItem) {
    if (!this.userData || this.userMoney < item.price) {
      this.notificationService.showError('Moedas insuficientes para comprar este item!');
      console.warn('Moedas insuficientes para comprar o item');
      return;
    }

    const newCoinsAmount = this.userMoney - item.price;
    
    // Monta o objeto completo do usuário com as moedas atualizadas
    const updatedUserData: any = {
      name: this.userData.name,
      email: this.userData.email,
      password: this.userData.password,
      reputation: this.userData.reputation,
      coins: newCoinsAmount,
      avatar: this.userData.avatar
    };
    
    this.userService.updateUser(this.userData.id, updatedUserData).subscribe({
      next: (updatedUser: User) => {
        // Atualiza os dados locais
        this.userData = updatedUser;
        this.userMoney = updatedUser.coins;
        
        // Atualiza o inventário
        this.updateInventory(item.key);
        
        // Notifica outros componentes sobre a mudança
        this.dataService.updateUserData(updatedUser);
        
        // Notificação de sucesso
        this.notificationService.showSuccess(`${item.title} comprado com sucesso!`);
        console.log(`Item ${item.title} comprado com sucesso!`);
      },
      error: (error) => {
        console.error('Erro ao atualizar moedas no backend:', error);
        this.notificationService.showError('Erro ao processar a compra. Tente novamente.');
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
          case 'ice':
            // Congelar tempo
            break;
          case '2xtime':
            // Duplicar tempo
            break;
          case '2xrepu':
            // Duplicar reputação
            break;
        }
      }
    }
  }
}
