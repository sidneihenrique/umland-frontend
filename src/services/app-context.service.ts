import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppContext = 'game-phase' | 'game-map' | 'select-map' | 'login' | 'register' | 'other';

export interface ContextState {
  context: AppContext;
  phaseId?: number;
  gameMapId?: number;
  canUseItems: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppContextService {
  private contextState = new BehaviorSubject<ContextState>({
    context: 'other',
    canUseItems: false
  });

  public contextState$: Observable<ContextState> = this.contextState.asObservable();

  constructor() {}

  setContext(context: AppContext, phaseId?: number, gameMapId?: number): void {
    const canUseItems = context === 'game-phase';
    
    this.contextState.next({
      context,
      phaseId,
      gameMapId,
      canUseItems
    });
  }

  getCurrentContext(): ContextState {
    return this.contextState.value;
  }

  canUseItems(): boolean {
    return this.contextState.value.canUseItems;
  }

  isInGamePhase(): boolean {
    return this.contextState.value.context === 'game-phase';
  }

  isInGameMap(): boolean {
    return this.contextState.value.context === 'game-map';
  }

  getCurrentPhaseId(): number | undefined {
    return this.contextState.value.phaseId;
  }

  getCurrentGameMapId(): number | undefined {
    return this.contextState.value.gameMapId;
  }
}
