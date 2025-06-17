import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private inventorySubject = new BehaviorSubject<any>(null);

  constructor(private ngZone: NgZone) {
    this.loadInitialInventory();
    window.addEventListener('storage', (e) => {
      if (e.key === 'inventory') {
        this.ngZone.run(() => {
          this.loadInitialInventory();
        });
      }
    });
  }

  private loadInitialInventory() {
    const inventoryJson = localStorage.getItem('inventory');
    if (inventoryJson) {
      const inventory = JSON.parse(inventoryJson);
      this.inventorySubject.next(inventory);
    }
  }

  getInventoryUpdates(): Observable<any> {
    return this.inventorySubject.asObservable();
  }

  updateInventory(inventory: any) {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    this.inventorySubject.next(inventory);
  }
}
