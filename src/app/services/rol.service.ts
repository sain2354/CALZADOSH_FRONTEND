// src/app/services/rol.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Rol } from '../models/rol.model'; // Import the Rol model

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = 'https://www.chbackend.somee.com/api/rol'; // Base URL for role endpoints

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de roles disponibles.
   * Llama a GET /api/rol.
   */
  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred in RolService:', error);
    return throwError(() => new Error('Error fetching roles; please try again later.'));
  }
}
