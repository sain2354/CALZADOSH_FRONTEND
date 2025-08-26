// src/app/services/medio-pago.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MedioPago } from '../models/medio-pago.model';

// Eliminamos la interfaz ApiResponse ya que no se usa en este endpoint
/*
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
*/

@Injectable({
  providedIn: 'root'
})
export class MedioPagoService {
  // **VERIFICA Y AJUSTA ESTA URL A LA DE TU ENDPOINT DE MEDIOS DE PAGO EN EL BACKEND**
  private apiUrl = 'https://www.chbackend.somee.com/api/MedioPago';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las formas de pago del backend.
   * Asume que el endpoint GET /api/MedioPago devuelve directamente List<MedioPagoResponse>.
   * @returns Un Observable con un array de objetos MedioPago.
   */
  getAllMediosPago(): Observable<MedioPago[]> {
     // Usamos directamente el tipo esperado en la respuesta
     return this.http.get<MedioPago[]>(this.apiUrl).pipe(
       catchError(this.handleError<MedioPago[]>('getAllMediosPago', []))
     );
  }

   /**
   * Maneja errores HTTP.
   * @param operation - Nombre de la operación que falló.
   * @param result - Valor opcional para retornar como resultado del Observable.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
