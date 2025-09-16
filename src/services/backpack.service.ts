import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface BackpackItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
  type: 'consumable' | 'tool' | 'artifact';
}

export interface BackpackData {
  items: BackpackItem[];
  maxSlots: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackpackService {

  constructor() { }

  // Mock da API para buscar dados da mochila
  getBackpackData(): Observable<BackpackData> {
    // Dados mockados com 3 bombas
    const mockData: BackpackData = {
      items: [
        {
          id: 'bomb_001',
          name: 'Explosão de Erros',
          description: 'Revele rapidamente todos os pontos críticos do diagrama. Use com sabedoria!',
          imageUrl: 'assets/store/bomb.png',
          quantity: 3,
          type: 'consumable'
        }
      ],
      maxSlots: 12
    };

    // Retorna imediatamente sem delay
    return of(mockData);
  }

  // Mock para usar um item
  useItem(itemId: string): Observable<boolean> {
    // Simula uso do item na API
    console.log(`Using item: ${itemId}`);
    return of(true).pipe(delay(300));
  }

  // Mock para adicionar item à mochila
  addItem(item: BackpackItem): Observable<boolean> {
    console.log(`Adding item to backpack:`, item);
    return of(true).pipe(delay(300));
  }

  // Mock para remover item da mochila
  removeItem(itemId: string): Observable<boolean> {
    console.log(`Removing item: ${itemId}`);
    return of(true).pipe(delay(300));
  }
}