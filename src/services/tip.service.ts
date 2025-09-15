import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface Tip {
  id: number;
  tip: string;
}

export interface CreateTipRequest {
  tip: string;
}

export interface UpdateTipRequest {
  tip?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TipService {
  private apiUrl = `${API_CONFIG.BASE_URL}/tips`;

  constructor(private http: HttpClient) { }

  /**
   * Busca todas as dicas
   * GET /tips
   */
  getAllTips(): Observable<Tip[]> {
    return this.http.get<Tip[]>(this.apiUrl);
  }

  /**
   * Busca dica por ID
   * GET /tips/{id}
   */
  getTipById(id: number): Observable<Tip> {
    return this.http.get<Tip>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria nova dica
   * POST /tips
   */
  createTip(tip: CreateTipRequest): Observable<Tip> {
    return this.http.post<Tip>(this.apiUrl, tip);
  }

  /**
   * Atualiza dica existente
   * PUT /tips/{id}
   */
  updateTip(id: number, tip: UpdateTipRequest): Observable<Tip> {
    return this.http.put<Tip>(`${this.apiUrl}/${id}`, tip);
  }

  /**
   * Deleta dica
   * DELETE /tips/{id}
   */
  deleteTip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}