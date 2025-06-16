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

  constructor(
    private dataService: DataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.dataService.getUserById(userId).subscribe(response => {
          this.userMoney = response.user.money;
        });
      }
    }
  }

  storeItems: StoreItem[] = [
    {
      imageUrl: '/assets/store/watch.png',
      title: 'TEMPO EXTRA',
      description: 'Adicione +60 segundos à sua fase atual. Ideal para quando o tempo está apertado!',
      price: 21
    },
    {
      imageUrl: '/assets/store/bomb.png',
      title: 'EXPLOSÃO DE ERROS',
      description: 'Revele rapidamente todos os pontos críticos do diagrama. Use com sabedoria!',
      price: 21
    },
    {
      imageUrl: '/assets/store/eraser.png',
      title: 'LIMPEZA INTELIGENTE',
      description: 'Remove elementos corretos para que você foque apenas nos erros',
      price: 21
    },
    {
      imageUrl: '/assets/store/lamp.png',
      title: 'IDEIA BRILHANTE',
      description: 'Receba uma dica certeira baseada na estrutura do seu diagrama.',
      price: 21
    }
  ];

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
  }

  onBuy(item: StoreItem) {
    console.log('Buying item:', item);
    // this.hide();
  }

  onUse(item: StoreItem) {
    console.log('Using item:', item);
  }
}
