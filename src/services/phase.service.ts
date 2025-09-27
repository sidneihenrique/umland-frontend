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
  parentPhaseId?: number;
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
      .set('characterDialogues', JSON.stringify(phaseData.characterDialogues));

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

  // ✅ Métodos utilitários para converter dados do frontend

  /**
   * Converte objeto Phase do frontend para CreatePhaseRequest
   */
  convertToCreateRequest(phase: any, characterId: number, gameMapId: number): CreatePhaseRequest {
    return {
      title: phase.title,
      type: phase.type.key,
      mode: 'BASIC', // ou phase.mode se existir
      maxTime: phase.maxTime || 3600, // 1 hora padrão
      status: 'AVAILABLE',
      character: {
        id: characterId,
        name: phase.character.name,
        filePath: phase.character.filePath
      },
      gameMap: {
        id: gameMapId,
        title: '', // Será preenchido pelo backend
        users: [],
        phases: []
      },
      diagramInitial: phase.diagramJSON ? JSON.stringify(phase.diagramJSON) : '',
      correctDiagrams: phase.correctDiagramsJson.map((diagram: any) => JSON.stringify(diagram)),
      characterDialogues: phase.character.dialogCharacter || []
    };
  }

  /**
   * Converte Phase da API para formato do frontend (se necessário)
   */
  convertToFrontendFormat(phase: Phase): any {
    return {
      id: phase.id,
      title: phase.title,
      description: `Fase ${phase.title}`, // Pode ser calculado ou vir da API
      type: {
        key: phase.type,
        title: this.getTypeTitle(phase.type),
        description: this.getTypeDescription(phase.type)
      },
      level: 'MEDIUM', // Pode ser calculado baseado em outros fatores
      diagramJSON: phase.diagramInitial ? JSON.parse(phase.diagramInitial) : null,
      correctDiagramsJson: phase.correctDiagrams.map(diagram => JSON.parse(diagram)),
      tips: [], // Pode vir de outra fonte ou ser calculado
      character: {
        name: phase.character.name,
        filePath: phase.character.filePath,
        dialogCharacter: phase.characterDialogues
      }
    };
  }

  /**
   * Retorna o objeto type completo baseado na chave
   */
  getPhaseType(typeKey: 'BUILD' | 'FIX' | 'COMPLETE'): PhaseType {
    return PHASE_TYPES[typeKey] || {
      key: typeKey,
      title: typeKey,
      description: 'Descrição não disponível'
    };
  }

  /**
   * Retorna todos os tipos disponíveis
   */
  getAllPhaseTypes(): PhaseType[] {
    return Object.values(PHASE_TYPES);
  }

  private getTypeTitle(type: string): string {
    switch(type) {
      case 'BUILD': return 'Construa do zero';
      case 'FIX': return 'Corrija o diagrama';
      case 'COMPLETE': return 'Complete o diagrama';
      default: return type;
    }
  }

  private getTypeDescription(type: string): string {
    switch(type) {
      case 'BUILD': return 'Nesta fase, você começará com um espaço em branco...';
      case 'FIX': return 'Nesta fase, você encontrará um diagrama parcialmente construído...';
      case 'COMPLETE': return 'Nesta fase, você deve completar o diagrama existente...';
      default: return '';
    }
  }
}
