import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';

export interface UserResponse {
    user: User;
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
    private readonly mockUsers: Record<string, UserResponse>;

    constructor(private http: HttpClient) {
        this.baseUrl = (window as any).apiUrl || 'http://api.example.com';

        // Mock de dados dos usuários
        this.mockUsers = {
            '1': {
                user: {
                    name: "Tiago",
                    money: 200,
                    reputation: 380,
                    progressing: true
                }
            },
            '33': {
                user: {
                    name: "Maria",
                    money: 25,
                    reputation: 104,
                    progressing: false
                }
            }
        };
    }

    getUserById(id: string): Observable<UserResponse> {
        return of(this.mockUsers[id]).pipe(
            delay(300),
            map(user => {
                if (!user) {
                    throw new Error('User not found');
                }
                return user;
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