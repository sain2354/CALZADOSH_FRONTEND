// src/app/TIENDA-ONLINE/services/subcategory.service.ts (VERSIÓN FINAL, AHORA SÍ, CORRECTA)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Subcategory } from './../models/subcategory'; // El modelo de la app espera la propiedad 'nombre'.

// Interface para la respuesta de la API, asumiendo el estándar camelCase de ASP.NET Core.
interface ApiSubcategory {
  idSubCategoria: number;
  descripcion: string; // <-- Se espera 'descripcion' en minúscula.
  idCategoria: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubcategoryService {
  private apiUrl = 'https://www.chbackend.somee.com/api/SubCategoria';

  constructor(private http: HttpClient) { }

  getSubcategories(): Observable<Subcategory[]> {
    // 1. Se llama a la API esperando una respuesta en formato camelCase.
    return this.http.get<ApiSubcategory[]>(this.apiUrl).pipe(
      map(apiSubcategories => {
        if (!Array.isArray(apiSubcategories)) {
          console.warn('La respuesta de subcategorías no es un array. Se devuelve [].');
          return [];
        }

        // 2. Se transforma el dato de la API al modelo de la aplicación.
        //    Se traduce 'descripcion' a 'nombre'.
        return apiSubcategories.map(apiSub => ({
          idSubCategoria: apiSub.idSubCategoria,
          nombre: apiSub.descripcion, // <-- ¡LA CORRECCIÓN DEFINITIVA!
          idCategoria: apiSub.idCategoria
        }));
      }),
      catchError(error => {
        console.error(`Error crítico al obtener subcategorías: ${error.message}`, error);
        return of([]); // Devuelve un array vacío si hay cualquier error.
      })
    );
  }
}
