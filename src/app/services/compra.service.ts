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
  // *** MÉTODO CORREGIDO PARA EL LISTADO: Devuelve Observable<CompraResponse[]> ***
  // Si tu API GET /api/Compras devuelve una lista que *es* CompraResponse, usa CompraResponse[]
  // Si devuelve una lista que *es como* Compra, y la usas en el frontend así, manten Compra[] pero es menos ideal.
  // Lo ideal es que tu backend endpoint /api/Compras devuelva CompraResponse[]
  obtenerCompras(): Observable<CompraResponse[]> { // *** Asumo que este método devuelve CompraResponse[] ahora ***
     // Llama al endpoint GET /api/Compras
    return this.http.get<CompraResponse[]>(`${this.baseUrl}`).pipe(
      catchError(this.handleError<CompraResponse[]>('obtenerCompras', [])) // *** CORREGIDO: Tipar el valor por defecto ***
    );
  }

  /**
   * Obtiene los detalles de una compra específica por su ID desde el backend.
   * Llama al endpoint GET /api/Compras/{id}.
   * @param id El ID de la compra.
   * @returns Un Observable con los detalles de la compra (CompraDetalleResponse).
   */
  // *** NUEVO MÉTODO PARA OBTENER DETALLE POR ID ***
  obtenerCompraPorId(id: number): Observable<CompraDetalleResponse> { // *** Devuelve Observable<CompraDetalleResponse> ***
    const url = `${this.baseUrl}/${id}`; // Llama al endpoint GET /api/Compras/{id}
    return this.http.get<CompraDetalleResponse>(url).pipe(
      catchError(this.handleError<CompraDetalleResponse>(`obtenerCompraPorId id=${id}`))
    );
  }

  /**
   * Maneja errores HTTP.
   * @param operation - Nombre de la operación que falló.
   * @param result - Valor opcional para retornar como resultado del Observable.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => { // *** CORREGIDO: Tipar error como HttpErrorResponse ***
      console.error(`${operation} failed:`, error);

      // Puedes loguear más detalles del error si el backend los proporciona
      if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente o de red
          console.error('Ocurrió un error:', error.error.message);
      } else {
           // El backend devolvió un código de respuesta no exitoso
          console.error(
              `Backend returned code ${error.status}, ` +
              `body was: ${JSON.stringify(error.error)}`); // Muestra el cuerpo de respuesta del backend
      }


      // Dejar que la aplicación continúe ejecutándose retornando un resultado vacío o un error específico.
      // Dependiendo de cómo quieras manejar los errores en el componente.
      // Por ahora, retornamos un Observable con un resultado vacío o el resultado por defecto.
      // Si quieres propagar el error, puedes usar throwError(error);
      return of(result as T);
    };
  }
}
