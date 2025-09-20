// src/app/TIENDA-ONLINE/services/subcategory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Subcategory } from './../models/subcategory';

@Injectable({
  providedIn: 'root'
})
export class SubcategoryService {
  private apiUrl = 'https://www.chbackend.somee.com/api/SubCategoria';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las subcategorías (marcas) desde el backend.
   */
  getSubcategories(): Observable<Subcategory[]> {
    return this.http.get<Subcategory[]>(this.apiUrl).pipe(
      tap(subcategories => console.log(`Subcategorías obtenidas: ${subcategories.length}`)),
      catchError(this.handleError<Subcategory[]>('getSubcategories', []))
    );
  }

  /**
   * Maneja los errores de las peticiones HTTP.
   * @param operation - nombre de la operación que falló
   * @param result - valor opcional para devolver como resultado
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} falló: ${error.message}`);
      // Devuelve un resultado seguro para que la aplicación no se bloquee
      return of(result as T);
    };
  }
}
