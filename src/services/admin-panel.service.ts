import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface Avatar { id?: number; filePath?: string; }
export interface Character { id?: number; name: string; filePath?: string; }
export interface Phase { id?: number; title: string; description: string; type: string; }
export interface Item { id?: number; title: string; description: string; price: number; filePath?: string; }

@Injectable({ providedIn: 'root' })
export class AdminPanelService {
  private api = API_CONFIG.BASE_URL;

  constructor(private http: HttpClient) {}

  // Avatar CRUD
  getAvatars(): Observable<Avatar[]> {
    return this.http.get<Avatar[]>(`${this.api}/avatars`);
  }
  createAvatar(avatar: Avatar, imageFile: File): Observable<Avatar> {
    const formData = new FormData();
    formData.append('avatar', new Blob([JSON.stringify(avatar)], { type: 'application/json' }));
    formData.append('image', imageFile);
    return this.http.post<Avatar>(`${this.api}/avatars`, formData);
  }
  updateAvatar(id: number, avatar: Avatar, imageFile?: File): Observable<Avatar> {
    const formData = new FormData();
    formData.append('avatar', new Blob([JSON.stringify(avatar)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.put<Avatar>(`${this.api}/avatars/${id}`, formData);
  }
  deleteAvatar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/avatars/${id}`);
  }

  // Character CRUD
  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.api}/characters`);
  }
  createCharacter(character: Character, imageFile: File): Observable<Character> {
    const formData = new FormData();
    formData.append('character', new Blob([JSON.stringify(character)], { type: 'application/json' }));
    formData.append('image', imageFile);
    return this.http.post<Character>(`${this.api}/characters`, formData);
  }
  updateCharacter(id: number, character: Character, imageFile?: File): Observable<Character> {
    const formData = new FormData();
    formData.append('character', new Blob([JSON.stringify(character)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.put<Character>(`${this.api}/characters/${id}`, formData);
  }
  deleteCharacter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/characters/${id}`);
  }

  // Phase CRUD
  getPhases(): Observable<Phase[]> {
    return this.http.get<Phase[]>(`${this.api}/phases`);
  }
  createPhase(phase: Phase): Observable<Phase> {
    return this.http.post<Phase>(`${this.api}/phases`, phase);
  }
  updatePhase(id: number, phase: Phase): Observable<Phase> {
    return this.http.put<Phase>(`${this.api}/phases/${id}`, phase);
  }
  deletePhase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/phases/${id}`);
  }

  // Item CRUD
  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.api}/items`);
  }
  createItem(item: Item, imageFile: File): Observable<Item> {
    const formData = new FormData();
    formData.append('item', new Blob([JSON.stringify(item)], { type: 'application/json' }));
    formData.append('image', imageFile);
    return this.http.post<Item>(`${this.api}/items`, formData);
  }
  updateItem(id: number, item: Item, imageFile?: File): Observable<Item> {
    const formData = new FormData();
    formData.append('item', new Blob([JSON.stringify(item)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.put<Item>(`${this.api}/items/${id}`, formData);
  }
  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/items/${id}`);
  }
}
