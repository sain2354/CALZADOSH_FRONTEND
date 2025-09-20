// src/app/TIENDA-ONLINE/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ProductoTienda } from '../models/producto-tienda.model';

export interface FilterParams {
  cat?: number;
  subCate?: number;
  genero?: string[];
  articulo?: string[];
  estilo?: string[];
  color?: string[];
  tallaU?: string[];
  precioMin?: number;
  precioMax?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = 'https://www.chbackend.somee.com/api/Producto';
  private readonly imageBaseUrl = 'https://www.chbackend.somee.com';

  constructor(private http: HttpClient) { }

  fetchProducts(filters: FilterParams = {}): Observable<ProductoTienda[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params = params.set(key, value.join(','));
          }
        } else if (String(value).trim() !== '') {
          params = params.set(key, String(value));
        }
      }
    });
    return this.http.get<ProductoTienda[]>(this.baseUrl, { params }).pipe(
      tap(products => console.log(`Productos obtenidos con filtros: ${products.length}`, filters)),
      catchError(this.handleError<ProductoTienda[]>('fetchProducts', []))
    );
  }

  fetchProductById(id: number): Observable<ProductoTienda> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<ProductoTienda>(url).pipe(
      catchError(this.handleError<ProductoTienda>(`fetchProductById id=${id}`))
    );
  }

  /**
   * (RESTAURADO) Construye la URL completa para una imagen de producto.
   */
  getImageUrl(imagePath?: string): string {
    if (!imagePath) {
      return 'assets/images/placeholder.png'; // Placeholder por defecto
    }
    if (imagePath.startsWith('http')) {
      return imagePath; // Ya es una URL completa
    }
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.imageBaseUrl}${path}`;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} falló:`, error);
      return of(result as T);
    };
  }
}
