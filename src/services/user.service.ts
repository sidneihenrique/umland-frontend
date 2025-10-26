import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { Avatar } from './phase.service';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  reputation: number;
  coins: number;
  avatar?: Avatar;
  inventory?: {
    id: number;
    items: any[];
  };
  gameMaps?: any[];
  progressing?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  idAvatar: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  reputation?: number;
  coins?: number;
  idAvatar?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) { }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) as User : null;
  }

  /**
   * Busca todos os usuários
   * GET /users
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  /**
   * Busca usuário por ID
   * GET /users/{id}
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Cria novo usuário
   * POST /users?name={name}&email={email}&password={password}&idAvatar={idAvatar}
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    const params = new HttpParams()
      .set('name', userData.name)
      .set('email', userData.email)
      .set('password', userData.password)
      .set('idAvatar', userData.idAvatar.toString());

    return this.http.post<User>(`${this.apiUrl}/users`, null, { params });
  }

  /**
   * Atualiza usuário existente
   * PUT /users/{id}
   */
  updateUser(id: number, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, userData);
  }

  /**
   * Deleta usuário
   * DELETE /users/{id}
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Login do usuário
   * POST /users/login?email={email}&password={password}
   */
  login(email: string, password: string): Observable<User[]> {
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);

    return this.http.post<User[]>(`${this.apiUrl}/users/login`, null, { params });
  }

  /**
   * Atualiza moedas do usuário
   */
  updateUserCoins(userId: number, coins: number): Observable<User> {
    return this.updateUser(userId, { coins });
  }

  /**
   * Atualiza reputação do usuário
   */
  updateUserReputation(userId: number, reputation: number): Observable<User> {
    return this.updateUser(userId, { reputation });
  }

  /**
   * Atualiza avatar do usuário
   */
  updateUserAvatar(userId: number, avatarId: number): Observable<User> {
    return this.updateUser(userId, { idAvatar: avatarId });
  }

  /**
   * Busca usuário por email (para validações)
   */
  getUserByEmail(email: string): Observable<User[]> {
    return this.getAllUsers(); // Filtrar no frontend por ora, ou criar endpoint específico
  }

  /**
   * Verifica se email já existe (para validação de registro)
   */
  checkEmailExists(email: string): Observable<boolean> {
    return new Observable(observer => {
      this.getUserByEmail(email).subscribe({
        next: (users) => {
          const exists = users.some(user => user.email === email);
          observer.next(exists);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

   // ✅ NOVO: Método para buscar todos os avatares
  getAllAvatars(): Observable<Avatar[]> {
    return this.http.get<Avatar[]>(`${this.apiUrl}/avatars`);
  }
}
