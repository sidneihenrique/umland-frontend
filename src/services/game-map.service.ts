import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { Phase } from './phase.service';
import { User } from './user.service';

// ✅ Interface PhaseUser baseada na entidade Java
export interface PhaseUser {
  id: number;
  phase: Phase;
  user: User;
  status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED';
  reputation: number;
  coins: number;
  accuracy?: number;
}

// Interface para GameMap
export interface GameMap {
  id?: number;
  title: string;
  users: User[];
  phases: Phase[];
}

@Injectable({ providedIn: 'root' })
export class GameMapService {
  private apiUrl = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) {}

  /**
   * ✅ NOVO: Busca todas as fases de um GameMap específico para um usuário
   * GET /gamemaps/{id}/phases?userId={userId}
   * @param gameMapId - ID do GameMap
   * @param userId - ID do usuário
   * @returns Observable<PhaseUser[]> - Lista de PhaseUser do GameMap para o usuário
   */
  getAllPhasesByUser(gameMapId: number, userId: number): Observable<PhaseUser[]> {
    console.log(`🗺️ Buscando fases do GameMap ID: ${gameMapId} para usuário ID: ${userId}`);
    
    const params = new HttpParams().set('userId', userId.toString());
    const url = `${this.apiUrl}/gamemaps/${gameMapId}/phases`;
    
    console.log(`🔗 URL: ${url}?userId=${userId}`);
    
    return this.http.get<PhaseUser[]>(url, { params });
  }

  /**
   * ❌ DEPRECIADO: Método antigo que buscava apenas Phase
   * Mantido para compatibilidade, mas deve ser removido futuramente
   */
  getAllPhases(idGameMap: number): Observable<Phase[]> {
    console.log(`⚠️ DEPRECIADO: Usando método antigo getAllPhases`);
    console.log(`🗺️ Buscando fases do GameMap ID: ${idGameMap}`);
    console.log(`🔗 URL: ${this.apiUrl}/gamemaps/${idGameMap}/phases`);
    
    return this.http.get<Phase[]>(`${this.apiUrl}/gamemaps/${idGameMap}/phases`);
  }

  // ✅ Métodos adicionais (caso precise no futuro)
  
  /**
   * Busca todos os GameMaps
   * GET /gamemaps
   */
  getAllGameMaps(): Observable<GameMap[]> {
    return this.http.get<GameMap[]>(`${this.apiUrl}/gamemaps`);
  }

  /**
   * Busca GameMap por ID
   * GET /gamemaps/{id}
   */
  getGameMapById(id: number): Observable<GameMap> {
    return this.http.get<GameMap>(`${this.apiUrl}/gamemaps/${id}`);
  }

  /**
   * Cria novo GameMap
   * POST /gamemaps
   */
  createGameMap(gameMap: Omit<GameMap, 'id'>): Observable<GameMap> {
    return this.http.post<GameMap>(`${this.apiUrl}/gamemaps`, gameMap);
  }

  /**
   * Atualiza GameMap existente
   * PUT /gamemaps/{id}
   */
  updateGameMap(id: number, gameMap: GameMap): Observable<GameMap> {
    return this.http.put<GameMap>(`${this.apiUrl}/gamemaps/${id}`, gameMap);
  }

  /**
   * Deleta GameMap
   * DELETE /gamemaps/{id}
   */
  deleteGameMap(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/gamemaps/${id}`);
  }
}