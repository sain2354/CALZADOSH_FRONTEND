// src/app/services/compra.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Importar HttpErrorResponse
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
// *** CORREGIDO: Importar las interfaces de Compra.model.ts, incluyendo las de respuesta ***
import { CompraRequest, Compra, CompraResponse, CompraDetalleResponse } from '../models/compra.model'; // Asegúrate de que la ruta es correcta

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private baseUrl = 'https://www.chbackend.somee.com/api/Compras'; // Asegúrate de que esta URL sea correcta

  constructor(private http: HttpClient) { }

  /**
   * Registra una nueva compra en el backend.
   * @param compraData Los datos de la compra a registrar (debe coincidir con CompraRequest del backend).
   * @returns Un Observable con la respuesta del backend.
   */
  crearCompra(compraData: CompraRequest): Observable<any> { // *** CORREGIDO: Tipar compraData como CompraRequest ***
    return this.http.post<any>(`${this.baseUrl}`, compraData).pipe(
      catchError(this.handleError<any>('crearCompra'))
    );
  }

  /**
   * Obtiene el listado de compras desde el backend.
   * @returns Un Observable con un array de objetos CompraResponse.
   */
  obtenerCompras(): Observable<CompraResponse[]> { 
    return this.http.get<CompraResponse[]>(`${this.baseUrl}`).pipe(
      catchError(this.handleError<CompraResponse[]>('obtenerCompras', []))
    );
  }

  /**
   * Obtiene los detalles de una compra específica por su ID desde el backend.
   * Llama al endpoint GET /api/Compras/{id}.
   * @param id El ID de la compra.
   * @returns Un Observable con los detalles de la compra (CompraDetalleResponse).
   */
  obtenerCompraPorId(id: number): Observable<CompraDetalleResponse> { 
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<CompraDetalleResponse>(url).pipe(
      catchError(this.handleError<CompraDetalleResponse>(`obtenerCompraPorId id=${id}`))
    );
  }

  /**
   * Elimina una compra por su ID.
   * @param id El ID de la compra a eliminar.
   * @returns Un Observable de la respuesta.
   */
  eliminarCompra(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<any>(url).pipe(
      catchError(this.handleError<any>(`eliminarCompra id=${id}`))
    );
  }

  /**
   * Maneja errores HTTP.
   * @param operation - Nombre de la operación que falló.
   * @param result - Valor opcional para retornar como resultado del Observable.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => { 
      console.error(`${operation} failed:`, error);

      if (error.error instanceof ErrorEvent) {
          console.error('Ocurrió un error:', error.error.message);
      } else {
          console.error(
              `Backend returned code ${error.status}, ` +
              `body was: ${JSON.stringify(error.error)}`);
      }

      return of(result as T);
    };
  }
}
