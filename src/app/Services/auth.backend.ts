import { inject, Injectable } from '@angular/core';
import { environment } from '../../Environnement/Environnement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HTTPAuthBack {
  private readonly authUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.authUrl}/${endpoint}`);
  }

  post<T>(endpoint: string, data: unknown) {
    return this.http.post<T>(`${this.authUrl}/${endpoint}`, data);
  }

  put<T>(endpoint: string, data: unknown) {
    return this.http.put<T>(`${this.authUrl}/${endpoint}`, data);
  }

  delete<T>(endpoint: string) {
    return this.http.delete<T>(`${this.authUrl}/${endpoint}`);
  }
}