import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { API_CONFIG } from '../config/api.config';
import { User } from '../services/user.service'; 


export interface UserResponse {
    user: User;
    inventory: Inventory;
}

export interface Inventory {
    watch: number;
    bomb: number;
    eraser: number;
    lamp: number;
}

export interface RegisterUser {
    id: number;
    nome: string;
    email: string;
    senha: string;
    reputacao: number;
    moedas: number;
    faseAtual: string | null;
}

export interface ApiError {
    error: string;
    statusCode?: number;
}

@Injectable({
    providedIn: 'root'
})

export class DataService {
    private readonly baseUrl: string;
    private currentUser: UserResponse | null = null;
    private userDataSubject = new BehaviorSubject<User | null>(null);

    public userData$ = this.userDataSubject.asObservable();

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.baseUrl = API_CONFIG.BASE_URL;
        if (isPlatformBrowser(this.platformId)) {
            this.baseUrl = (window as any).apiUrl || this.baseUrl;
        }
    }

    registerUser(user: RegisterUser): Observable<any> {
        const url = `${this.baseUrl}/usuarios/`;
        return this.http.post(url, user).pipe(
            catchError(error => {
                console.error('Error during user registration:', error);
                throw {
                    error: error.message || 'Failed to register user',
                    statusCode: error.status
                } as ApiError;
            })
        );
    }

    private getDefaultUserData(id: string): UserResponse | null {
        
        return null;
    }

    updateUserData(userData: User) {
        if (isPlatformBrowser(this.platformId)) {
            // ✅ CORRIGIDO: Usar 'currentUser' para consistência
            localStorage.setItem('currentUser', JSON.stringify(userData));
            this.userDataSubject.next(userData);
        }
    }

    loadUserData(): User | null {
        if (isPlatformBrowser(this.platformId)) {
            // ✅ CORRIGIDO: Usar 'currentUser' para consistência
            const userJson = localStorage.getItem('currentUser');
            if (userJson) {
                const userData = JSON.parse(userJson);
                this.userDataSubject.next(userData);
                return userData;
            }
        }
        return null;
    }

    getUserById(id: string): Observable<UserResponse> {
        return of(null).pipe(
            delay(300),
            map(() => {
                const defaultData = this.getDefaultUserData(id);
                if (!defaultData) {
                    throw new Error('User not found');
                }

                if (isPlatformBrowser(this.platformId)) {
                    const userData = this.loadUserData();
                    if (userData) {
                        return {
                            user: userData,
                            inventory: JSON.parse(localStorage.getItem('inventory') || '{}')
                        };
                    }
                }

                return defaultData;
            }),
            catchError(error => {
                throw {
                    error: error.message || 'User not found',
                    statusCode: 404
                } as ApiError;
            })
        );
    }

    private getUserByIdHttp(id: string): Observable<UserResponse> {
        return this.http.get<UserResponse>(`${this.baseUrl}/user/${id}`).pipe(
            catchError(error => {
                throw {
                    error: error.message || 'Failed to fetch user',
                    statusCode: error.status
                } as ApiError;
            })
        );
    }
}