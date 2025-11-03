// src/app/TIENDA-ONLINE/services/subcategory.service.ts (VERSIÓN FINAL Y ROBUSTA)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, shareReplay, map } from 'rxjs/operators';
import { Subcategory } from './../models/subcategory';

// Interface para la respuesta cruda de la API (con PascalCase)
interface ApiSubcategory {
  IdSubCategoria: number;
  Nombre: string;
  IdCategoria: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubcategoryService {
  private apiUrl = 'https://www.chbackend.somee.com/api/SubCategoria';
  private subcategoriesCache$: Observable<Subcategory[]> | null = null;

  constructor(private http: HttpClient) { }

  getSubcategories(): Observable<Subcategory[]> {
    // Forzamos la recarga de datos para evitar problemas de caché durante la depuración.
    // Esto garantiza que la transformación de datos siempre se ejecute.
    this.subcategoriesCache$ = null;

    if (!this.subcategoriesCache$) {
      this.subcategoriesCache$ = this.http.get<ApiSubcategory[]>(this.apiUrl).pipe(
        map(apiSubcategories => {
          // Este es el ÚNICO punto donde se transforman los datos.
          // De PascalCase (API) a camelCase (App).
          return apiSubcategories.map(apiSub => ({
            idSubCategoria: apiSub.IdSubCategoria,
            nombre: apiSub.Nombre, // La corrección clave está aquí.
            idCategoria: apiSub.IdCategoria
          }));
        }),
        shareReplay(1), // Guardamos en caché la respuesta ya transformada.
        catchError(error => {
          console.error(`getSubcategories falló estrepitosamente: ${error.message}`);
          this.subcategoriesCache$ = null; // Limpiamos caché en caso de error.
          return of([]);
        })
      );
    }
    return this.subcategoriesCache$;
  }
}
