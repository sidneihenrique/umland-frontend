import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from './user.service';
import { GameMap } from './game-map.service';
import { API_CONFIG } from '../config/api.config';

export interface Avatar { 
  id?: number; 
  filePath?: string; 
}

// Interface para Character
export interface Character {
  id?: number;
  name: string;
  filePath: string;
}

export type PhaseNodeType = 'ACTIVITY' | 'DECISION';

export interface PhaseTransition {
  id?: number;
  fromPhase?: Phase | null;        
  toPhase?: Phase | null;   
  optionText?: string | null;
}

export interface Phase {
  id?: number;
  title: string;
  description?: string;
  type: 'BUILD' | 'FIX' | 'COMPLETE';
  mode: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  maxTime: number;
  character: Character
  gameMap: GameMap;
  diagramInitial?: string;
  correctDiagrams: string[];
  characterDialogues: string[];
  nodeType?: PhaseNodeType;  // 'ACTIVITY' | 'DECISION'
  diagramType?: 'CLASS' | 'USE_CASE';
  phaseTransitions?: PhaseTransition[];
  incomingTransitions?: number[];
  outgoingTransitions?: number[];
}

// Interface para criar Phase (sem ID)
export interface CreatePhaseRequest {
  title: string;
  type: 'BUILD' | 'FIX' | 'COMPLETE';
  mode: 'BASIC' | 'ADVANCED';
  maxTime: number;
  status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED';
  character: {
    id: number;
    name: string;
    filePath: string;
  };
  gameMap: {
    id: number;
    title: string;
    users: User[];
    phases: Phase[];
  };
  diagramInitial: string;
  correctDiagrams: string[];
  characterDialogues: string[];
  diagramType?: 'CLASS' | 'USE_CASE';
}

// Interface para atualizar Phase
export interface UpdatePhaseRequest {
  title?: string;
  type?: 'BUILD' | 'FIX' | 'COMPLETE';
  mode?: 'BASIC' | 'ADVANCED';
  maxTime?: number;
  status?: 'LOCKED' | 'AVAILABLE' | 'COMPLETED';
  character?: {
    id: number;
    name: string;
    filePath: string;
  };
  gameMap?: {
    id: number;
    title: string;
    users: User[];
    phases: Phase[];
  };
  diagramInitial?: string;
  correctDiagrams?: string[];
  characterDialogues?: string[];
  diagramType?: 'CLASS' | 'USE_CASE';
}

export interface PhaseType {
  key: 'BUILD' | 'FIX' | 'COMPLETE';
  title: string;
  description: string;
}

// ✅ Mapa de tipos como constante
export const PHASE_TYPES: Record<'BUILD' | 'FIX' | 'COMPLETE', PhaseType> = {
  BUILD: {
    key: 'BUILD',
    title: 'Construa do zero',
    description: 'Nesta fase, você começará com um espaço em branco. Seu objetivo é construir o diagrama completo do zero, adicionando todos os elementos e relações necessários. Use sua criatividade e conhecimento para montar a solução correta. Ao finalizar, compare com a resposta esperada'
  },
  FIX: {
    key: 'FIX',
    title: 'Corrija o diagrama',
    description: 'Nesta fase, você encontrará um diagrama parcialmente construído com alguns erros. Sua missão é identificar e corrigir os problemas existentes, ajustando elementos mal posicionados ou relações incorretas. Analise cuidadosamente cada parte do diagrama'
  },
  COMPLETE: {
    key: 'COMPLETE',
    title: 'Complete o diagrama',
    description: 'Nesta fase, você deve completar o diagrama existente adicionando os elementos e relações que estão faltando. O diagrama já possui uma base, mas precisa ser finalizado para estar completo e correto'
  }
};

@Injectable({ providedIn: 'root' })
export class PhaseService {
  private apiUrl = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) {}

  // ✅ Métodos para comunicação com a API

  /**
   * Busca todas as fases
   * GET /phases
   */
  getAllPhases(): Observable<Phase[]> {
    return this.http.get<Phase[]>(`${this.apiUrl}/phases`);
  }

  /**
   * Busca fase por ID
   * GET /phases/{id}
   */
  getPhaseById(id: number): Observable<Phase> {
    return this.http.get<Phase>(`${this.apiUrl}/phases/${id}`);
  }

  /**
   * Cria nova fase
   * POST /phases
   */
  createPhase(phaseData: CreatePhaseRequest): Observable<Phase> {
    const params = new HttpParams()
      .set('title', phaseData.title)
      .set('type', phaseData.type)
      .set('mode', phaseData.mode)
      .set('maxTime', phaseData.maxTime.toString())
      .set('status', phaseData.status)
      .set('characterId', phaseData.character.id.toString())
      .set('gameMapId', phaseData.gameMap.id.toString())
      .set('diagramInitial', phaseData.diagramInitial)
      .set('correctDiagrams', JSON.stringify(phaseData.correctDiagrams))
      .set('characterDialogues', JSON.stringify(phaseData.characterDialogues))
      .set('diagramType', phaseData.diagramType || 'USE_CASE');

    return this.http.post<Phase>(`${this.apiUrl}/phases`, null, { params });
  }

  /**
   * Atualiza fase existente
   * PUT /phases/{id}
   */
  updatePhase(id: number, phaseData: UpdatePhaseRequest): Observable<Phase> {
    return this.http.put<Phase>(`${this.apiUrl}/phases/${id}`, phaseData);
  }

  /**
   * Deleta fase
   * DELETE /phases/{id}
   */
  deletePhase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/phases/${id}`);
  }

    // TRANSITIONS (endpoints sugeridos; ajuste aos seus endpoints reais)
  getTransitionsByFromPhase(phaseId: number): Observable<PhaseTransition[]> {
    return this.http.get<PhaseTransition[]>(`${this.apiUrl}/phases/${phaseId}/outgoing-transitions`);
  }

  getTransitionsByToPhase(phaseId: number): Observable<PhaseTransition[]> {
    return this.http.get<PhaseTransition[]>(`${this.apiUrl}/phases/${phaseId}/incoming-transitions`);
  }

  createTransition(t: { fromPhase: number | null; toPhase: number | null; optionText?: string | null }): Observable<PhaseTransition> {
    return this.http.post<PhaseTransition>(`${this.apiUrl}/phase-transitions`, t);
  }

  updateTransition(id: number, t: { fromPhase: number | null; toPhase: number | null; optionText?: string | null }): Observable<PhaseTransition> {
    return this.http.put<PhaseTransition>(`${this.apiUrl}/phase-transitions/${id}`, t);
  }

  deleteTransition(transitionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/phase-transitions/${transitionId}`);
  }

}
