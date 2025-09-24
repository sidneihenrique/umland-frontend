import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class PhaseUserService {
  
  private apiUrl = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) { }

  /**
   * Busca uma PhaseUser específica por ID
   * GET /phase-users/{id}
   * @param id - ID da PhaseUser
   * @returns Observable<PhaseUser>
   */
  getByPhaseAndUserId(phaseId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/phase-users/by-phase-and-user?phaseId=${phaseId}&userId=${userId}`);
  }

  /**
   * Atualiza o diagrama do usuário para uma PhaseUser específica
   * PATCH /phase-users/{id}/user-diagram
   * @param id - ID da PhaseUser
   * @param userDiagram - Diagrama do usuário em formato JSON string
   */
  updateUserDiagram(id: number, userDiagram: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/phase-users/${id}/user-diagram`, userDiagram, {
      headers: {
        'Content-Type': 'application/json'  // ✅ Mudança aqui
      }
    });
  }
}
