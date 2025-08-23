import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Importar HttpParams
import { Observable, of } from 'rxjs';
import { Producto } from '../models/producto.model';
import { catchError, tap } from 'rxjs/operators'; // Importar operadores tap y catchError

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

  /**
   * Busca productos por término (nombre o código).
   * @param termino El término de búsqueda.
   * @returns Un Observable con un array de productos coincidentes.
   */
  buscarProductos(termino: string): Observable<Producto[]> {
    if (!termino.trim()) {
      // Si el término está vacío, retornar un observable vacío
      return of([]);
    }
    // **AJUSTA LA URL DEL ENDPOINT DE BÚSQUEDA SEGÚN TU BACKEND**
    const url = `${this.baseUrl}/buscar?termino=${termino}`;
    return this.http.get<Producto[]>(url).pipe(
      tap(x => x.length ?
        console.log(`found products matching "${termino}"`) :
        console.log(`no products matching "${termino}"`)),
      catchError(error => {
        console.error(`Error searching products: ${error.message}`);
        return of([]); // Retorna un arreglo vacío en caso de error
      })
    );
  }
}
