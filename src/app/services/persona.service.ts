// src/app/services/persona.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Persona } from '../models/persona.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  // Usar HTTPS
  private apiUrl = 'http://www.chbackend.somee.com/api/Persona';

  constructor(private http: HttpClient) {}

  /** GET /api/Persona → devuelve ApiResponse<Persona[]> */
  getAllPersonas(): Observable<Persona[]> {
    return this.http.get<ApiResponse<Persona[]>>(this.apiUrl).pipe(
      map(response => {
        return response.success && response.data ? response.data : [];
      })
    );
  }

  /** POST /api/Persona → devuelve ApiResponse<PersonaResponse> */
  createPersona(persona: Persona): Observable<Persona> {
    return this.http
      .post<ApiResponse<Persona>>(this.apiUrl, persona)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Error al crear persona');
        })
      );
  }

  /** PUT /api/Persona/{id} → devuelve ApiResponse<PersonaResponse> */
  updatePersona(idPersona: number, persona: Persona): Observable<Persona> {
    return this.http
      .put<ApiResponse<Persona>>(`${this.apiUrl}/${idPersona}`, persona)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Error al actualizar persona');
        })
      );
  }

  /** DELETE /api/Persona/{id} → devuelve ApiResponse<null> */
  deletePersona(idPersona: number): Observable<{ success: boolean; message?: string }> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${idPersona}`)
      .pipe(
        map(response => {
          return {
            success: response.success,
            message: response.message
          };
        })
      );
  }
}
