import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Producto } from '../models/producto.model';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  /**
   * Ajusta esto a la URL real de tu API.
   */
  private baseUrl = 'https://www.chbackend.somee.com/api/Producto';

  constructor(private http: HttpClient) {}

  getAll(
    cat?: number,
    genero?: string | null,
    articulo?: string | null,
    estilo?: string | null
  ): Observable<Producto[]> {
    let params = new HttpParams().set('cat', cat ?? 0);

    if (genero && genero !== 'Todos') {
      params = params.set('genero', genero);
    }
    if (articulo && articulo !== 'Todos') {
      params = params.set('articulo', articulo);
    }
    if (estilo && estilo !== 'Todos') {
      params = params.set('estilo', estilo);
    }

    return this.http.get<Producto[]>(`${this.baseUrl}`, { params });
  }

  crearProductoConArchivo(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}/createWithFile`, formData);
  }

  crearProducto(producto: any): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}`, producto);
  }

  /**
   * Actualizar producto con JSON (PUT). Usar cuando no hay imagen multipart.
   */
  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, producto);
  }

  /**
   * Intento de actualización enviando FormData (multipart). Uso PUT para mantener semántica.
   * El backend en tu controller tiene [Consumes("multipart/form-data")] para PUT.
   */
  updateProductoFormData(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, formData);
  }

  /**
   * Alternativa por si tu backend implementó un endpoint específico para update con file (POST).
   * No lo usamos en el componente actual, lo dejo por compatibilidad.
   */
  updateProductoWithFile(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/updateWithFile/${id}`, formData);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  buscarProductos(termino: string): Observable<Producto[]> {
    if (!termino.trim()) {
      return of([]);
    }
    const url = `${this.baseUrl}/buscar?termino=${termino}`;
    return this.http.get<Producto[]>(url).pipe(
      tap(x => x.length ?
        console.log(`found products matching "${termino}"`) :
        console.log(`no products matching "${termino}"`)),
      catchError(error => {
        console.error(`Error searching products: ${error.message}`);
        return of([]);
      })
    );
  }

  /**
   * Construye una URL completa para una imagen devuelta por el backend (si el backend
   * guarda solo el nombre de archivo o la ruta parcial). Normaliza entradas que ya
   * contienen 'uploads' o que empiezan con '/'. Ajusta la ruta si tu servidor usa otra carpeta.
   */
  getImageFullUrl(path?: string | null): string | null {
    if (!path) return null;
    // Si es URL absoluta, devolvemos tal cual.
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    // Limpiar barras iniciales
    let cleaned = path.replace(/^\/+/, '');

    // Base sin "/api/Producto"
    const base = this.baseUrl.replace(/\/api\/Producto\/?$/, '');

    // Si la cadena ya contiene 'uploads/' al inicio o en otra parte, retornamos base + '/' + cleaned
    if (cleaned.indexOf('uploads/') !== -1) {
      return `${base}/${cleaned}`;
    }

    // Si solo es nombre de archivo, retornamos base + '/uploads/{file}'
    return `${base}/uploads/${cleaned}`;
  }
}
