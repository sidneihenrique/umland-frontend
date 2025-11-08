import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';

export interface BackpackItem {
  id: string;
  key: string;              // chave que corresponde ao catálogo / itemName do backend
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
  type: 'consumable' | 'tool' | 'artifact';
  eventName?: string;      // novo atributo pedido
}

export interface BackpackData {
  items: BackpackItem[];
  maxSlots: number;
}

export interface InventoryItemDto {
  id?: number;
  itemName?: string;
  quantity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackpackService {
  private apiUrl = API_CONFIG.BASE_URL;

  // catálogo / templates idênticos ao usado na loja, agora incluindo eventName
  private storeItemTemplates: Record<string, { imageUrl: string; title: string; description: string; type: BackpackItem['type']; eventName: string }> = {
    watch: {
      imageUrl: '/assets/store/watch.png',
      title: 'TEMPO EXTRA',
      description: 'Adicione +60 segundos à sua fase atual. Ideal para quando o tempo está apertado!',
      type: 'consumable',
      eventName: 'item.use.watch'
    },
    bomb: {
      imageUrl: '/assets/store/bomb.png',
      title: 'EXPLOSÃO DE ERROS',
      description: 'Revele rapidamente todos os pontos críticos do diagrama. Use com sabedoria!',
      type: 'consumable',
      eventName: 'item.use.bomb'
    },
    eraser: {
      imageUrl: '/assets/store/eraser.png',
      title: 'BORRACHETA',
      description: 'Remova elementos incorretos do diagrama automaticamente.',
      type: 'tool',
      eventName: 'item.use.eraser'
    },
    lamp: {
      imageUrl: '/assets/store/lamp.png',
      title: 'LÂMPADA',
      description: 'Mostra uma dica útil para a fase atual.',
      type: 'tool',
      eventName: 'item.use.lamp'
    },
    ice: {
      imageUrl: '/assets/store/ice.png',
      title: 'CONGELAMENTO',
      description: 'Congele o tempo da fase atual e resolva os desafios sem pressão!',
      type: 'consumable',
      eventName: 'item.use.ice'
    },
    '2xtime': {
      imageUrl: '/assets/store/2xtime.png',
      title: 'TEMPO DUPLICADO',
      description: 'Duplique todo o tempo disponível na fase atual.',
      type: 'consumable',
      eventName: 'item.use.2xtime'
    },
    '2xrepu': {
      imageUrl: '/assets/store/2xrepu.png',
      title: 'REPUTAÇÃO EM DOBRO',
      description: 'Ganhe o dobro de reputação ao completar a fase.',
      type: 'consumable',
      eventName: 'item.use.2xrepu'
    }
  };

  constructor(private http: HttpClient) {}

  /**
   * Busca o inventário do usuário no backend e converte para BackpackData
   * - userId (opcional): se não passar, tenta ler do localStorage('userId')
   * - fallback: retorna um BackpackData vazio (maxSlots = 12) se não houver userId
   */
  getBackpackData(userId?: number): Observable<BackpackData> {
    let uid = userId;
    if (!uid) {
      const s = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      uid = s ? Number(s) : undefined;
    }
    if (!uid) {
      // fallback: devolve lista vazia (sem mocks de itens reais)
      return of({ items: [], maxSlots: 12 });
    }

    // chama backend: GET /inventories/user/{userId}/items
    return this.http.get<InventoryItemDto[]>(`${this.apiUrl}/inventories/user/${uid}/items`).pipe(
      map((itemsDto = []) => {
        // converte array de InventoryItemDto em um mapa key -> quantidade
        const mapQty: Record<string, number> = {};
        for (const dto of itemsDto) {
          const key = (dto.itemName || '') as string;
          if (!key) continue;
          const q = Number(dto.quantity || 0);
          mapQty[key] = (mapQty[key] || 0) + (isNaN(q) ? 0 : q);
        }

        // monta BackpackItem[] usando templates do catálogo (se template ausente, cria um genérico)
        const items: BackpackItem[] = Object.keys(mapQty).map(k => {
          const tpl = this.storeItemTemplates[k];
          return {
            id: `${k}`,
            key: k,
            name: tpl ? tpl.title : k,
            description: tpl ? tpl.description : '',
            imageUrl: tpl ? tpl.imageUrl : '/assets/store/default.png',
            quantity: mapQty[k],
            type: tpl ? tpl.type : 'consumable',
            eventName: tpl ? tpl.eventName : undefined
          } as BackpackItem;
        });

        // maxSlots pode vir do backend no futuro; por enquanto fixamos 12
        return { items, maxSlots: 12 } as BackpackData;
      })
    );
  }

  /**
   * Use um item via backend e dispara o evento global do item (eventName)
   * POST /inventories/user/{userId}/items/{itemName}/use
   */
  useItem(userId: number, itemName: string): Observable<any> {
    const safe = encodeURIComponent(itemName);
    const tpl = this.storeItemTemplates[itemName];
    return this.http.post<any>(`${this.apiUrl}/inventories/user/${userId}/items/${safe}/use`, null).pipe(
      tap((res) => {
        // dispatch global event com detalhe mínimo (userId, itemName, backendResponse)
        try {
          const eventName = tpl ? tpl.eventName : (`item.use.${itemName}`);
          const detail = { userId, itemName, response: res };
          window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch (e) {
          // noop — não queremos quebrar a cadeia por erro de dispatch
          console.warn('BackpackService: dispatch event failed', e);
        }
      })
    );
  }

  addItem(userId: number, itemName: string) {
    const params = new HttpParams().set('itemName', itemName);
    return this.http.post<any>(`${this.apiUrl}/inventories/user/${userId}/items`, null, { params });
  }
}