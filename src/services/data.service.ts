import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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

export interface User {
    name: string;
    money: number;
    reputation: number;
    progressing: boolean;
}

export interface ApiError {
    error: string;
    statusCode?: number;
}

@Injectable({
    providedIn: 'root'  // singleton disponível em toda a aplicação
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
        // URL para SSR
        this.baseUrl = 'http://api.example.com';
        if (isPlatformBrowser(this.platformId)) {
            this.baseUrl = (window as any).apiUrl || this.baseUrl;
        }
    }    private getDefaultUserData(id: string): UserResponse | null {
        if (id === '1') {
            return {
                user: {
                    name: "Tiago",
                    money: 200,
                    reputation: 380,
                    progressing: true
                },
                inventory: {
                    watch: 0,
                    bomb: 0,
                    eraser: 0,
                    lamp: 0
                }
            };
        } else if (id === '33') {
            return {
                user: {
                    name: "Maria",
                    money: 25,
                    reputation: 104,
                    progressing: false
                },
                inventory: {
                    watch: 0,
                    bomb: 0,
                    eraser: 0,
                    lamp: 0
                }
            };
        }
        return null;
    }

    // Método para atualizar dados do usuário no localStorage e notificar observers
    updateUserData(userData: User) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', JSON.stringify(userData));
            this.userDataSubject.next(userData);
        }
    }

    // Método para carregar dados do usuário do localStorage
    loadUserData(): User | null {
        if (isPlatformBrowser(this.platformId)) {
            const userJson = localStorage.getItem('user');
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