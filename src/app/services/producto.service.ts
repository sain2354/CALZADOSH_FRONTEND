import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Importar HttpParams
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  /**
   * Ajusta esto a la URL real de tu API.
   * Ya incluye /api/Producto al final, así que no lo repitas.
   */
  private baseUrl = 'http://www.chbackend.somee.com/api/Producto';

  constructor(private http: HttpClient) {}

  /**
   * Obtener productos, filtrados por categoría (cat), género, artículo y estilo.
   * Todos los filtros son opcionales.
   */
  getAll(
    cat?: number,
    genero?: string | null,
    articulo?: string | null,
    estilo?: string | null
  ): Observable<Producto[]> {
    // Empezamos con los parámetros de categoría
    let params = new HttpParams().set('cat', cat ?? 0);

    // Añadimos los nuevos parámetros si existen y no son 'Todos' o nulos
    if (genero && genero !== 'Todos') {
      params = params.set('genero', genero);
    }
    if (articulo && articulo !== 'Todos') {
      params = params.set('articulo', articulo);
    }
    if (estilo && estilo !== 'Todos') {
      params = params.set('estilo', estilo);
    }

    // Realizamos la llamada HTTP incluyendo todos los parámetros
    return this.http.get<Producto[]>(`${this.baseUrl}`, { params });
  }

  /**
   * Crear producto con archivo (multipart/form-data).
   * Llamamos a POST /api/Producto/createWithFile
   */
  crearProductoConArchivo(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}/createWithFile`, formData);
  }

  /**
   * Crear producto enviando JSON (sin archivo).
   * Llamamos a POST /api/Producto
   * (No lo uses si quieres subir imagen como archivo).?
   */
  crearProducto(producto: any): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}`, producto);
  }

  /**
   * Actualizar producto (PUT /api/Producto/{id}).
   */
  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, producto);
  }

  /**
   * Eliminar producto (DELETE /api/Producto/{id}).
   */
  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
