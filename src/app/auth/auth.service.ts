import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { User } from '../../services/user.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey: string = "authToken";
  private userKey: string = "authUser";
  private api = 'http://localhost:9090';

  constructor(private http: HttpClient,
              @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Criar query parameters
    const params = new HttpParams()
      .set('email', credentials.email)
      .set('password', credentials.password);

    // Enviar como query parameters (null no body)
    return this.http.post<any[]>(`${this.api}/users/login`, null, { params })
      .pipe(
        map(users => {
          // Como sua API retorna List<User>, transformar em LoginResponse
          if (users && users.length > 0) {
            const user = users[0];
            return {
              token: 'tokenDefault', // Sua API não retorna token, então deixar vazio por ora
              user: user
            };
          } else {
            throw new Error('Usuário não encontrado');
          }
        }),
        tap(response => {
          this.setToken(response.token);
          this.setUser(response.user);
          // Salvar userId para compatibilidade
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('userId', response.user.id.toString());
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    console.log('Registrando usuário com dados:', userData);
    
    // ✅ Enviar como query parameters ao invés de JSON no body
    const params = new HttpParams()
      .set('name', userData.name)
      .set('email', userData.email)
      .set('password', userData.password)
      .set('idAvatar', '1'); // ID padrão do avatar, ou permitir escolha

    // ✅ Enviar null no body e params como query parameters
    return this.http.post(`${this.api}/users`, null, { params });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.api}/users/logout`, {})
      .pipe(
        tap(() => {
          this.clearAuth();
        })
      );
  }

  // ✅ Métodos auxiliares corrigidos com verificação de plataforma
  private setToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private setUser(user: User) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  public getCurrentUser(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem(this.userKey);
      return userJson ? JSON.parse(userJson) as User : null;
    }
    return null;
  }

  private clearAuth() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  isLoggedIn(): boolean {
    if (typeof localStorage !== 'undefined') {
      return !!localStorage.getItem(this.tokenKey);
    }
    return false;
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  getUser(): any {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Método para verificar se o token ainda é válido
  validateToken(): Observable<boolean> {
    return this.http.get<boolean>(`${this.api}/auth/validate`);
  }

  // Método para logout local (sem chamada à API)
  logoutLocal() {
    this.clearAuth();
  }
}