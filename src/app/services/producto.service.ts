import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Producto } from '../models/producto.model';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Base API (sin ruta de recurso) y endpoint específico para Producto
  private baseApi = 'https://www.chbackend.somee.com';
  private productEndpoint = `${this.baseApi}/api/Producto`;

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

    return this.http.get<Producto[]>(`${this.productEndpoint}`, { params });
  }

  crearProductoConArchivo(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(`${this.productEndpoint}/createWithFile`, formData);
  }

  crearProducto(producto: any): Observable<Producto> {
    return this.http.post<Producto>(`${this.productEndpoint}`, producto);
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.productEndpoint}/${id}`, producto);
  }

  updateProductoFormData(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.productEndpoint}/${id}`, formData);
  }

  updateProductoWithFile(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.productEndpoint}/updateWithFile/${id}`, formData);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.productEndpoint}/${id}`);
  }

  buscarProductos(termino: string): Observable<Producto[]> {
    if (!termino.trim()) {
      return of([]);
    }
    const url = `${this.productEndpoint}/buscar?termino=${encodeURIComponent(termino)}`;
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
   * Devuelve una URL absoluta y normalizada para la imagen del producto.
   * - Si `path` ya es absoluta (http/https) la devuelve tal cual.
   * - Normaliza barras duplicadas y evita rutas como '/uploads//uploads/...'
   * - Si solo recibe nombre de archivo -> asume carpeta '/uploads/{file}'
   * - Si recibe una ruta que incluye '/api/Producto' la limpia.
   */
  getImageFullUrl(path?: string | null): string | null {
    if (!path) return null;

    const p = (path || '').trim();

    // Si ya es URL absoluta -> devolver
    if (p.startsWith('http://') || p.startsWith('https://')) {
      return p;
    }

    // Limpiar prefijos comunes que pueden venir desde el backend
    let cleaned = p.replace(/\\/g, '/');           // normalizar backslashes
    cleaned = cleaned.replace(/\/{2,}/g, '/');    // eliminar // repetidos
    cleaned = cleaned.replace(/^\/+/, '');        // eliminar slashes al inicio
    cleaned = cleaned.replace(/^\s+|\s+$/g, '');  // trim

    // Si la ruta contiene 'api/Producto' (o similar), quitar esa parte
    cleaned = cleaned.replace(/^(api\/Producto\/?)/i, '');
    cleaned = cleaned.replace(/^(\/?api\/Producto\/?)/i, '');

    // Evitar duplicar 'uploads' -> dejar solo una ocurrencia
    cleaned = cleaned.replace(/(\/?uploads\/?)+/i, 'uploads/');

    // Si después de limpiar la ruta quedó algo con 'uploads/' lo usamos tal cual
    // sino asumimos que es solo nombre de archivo y lo ponemos en uploads/
    const finalPath = cleaned.toLowerCase().includes('uploads/') ? cleaned : `uploads/${cleaned}`;

    // Construir URL final y asegurarnos de que esté bien codificada
    const url = `${this.baseApi}/${finalPath}`.replace(/\/{2,}/g, '/'); // eliminar // accidental
    // Reponer protocolo correcto si fue recortado por replace anterior (caso raro)
    const normalizedUrl = url.startsWith('http') ? url : `https://${url.replace(/^https?:\/+/, '')}`;

    // encodeURI para evitar problemas con espacios o caracteres especiales
    return encodeURI(normalizedUrl);
  }

  /**
   * DataURL placeholder pequeño para fallbacks (1x1 transparent PNG).
   * Puedes retornarlo desde aquí y usarlo donde lo necesites.
   */
  getPlaceholderImage(): string {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  }

  /**
   * (Opcional) Helper para convertir una imagen remota a dataURL usando fetch.
   * Útil si quieres generar PDF con imágenes embebidas (fetch -> blob -> FileReader).
   * OJO: si el servidor no permite CORS, esto fallará y deberás habilitar CORS en el backend.
   */
  async fetchImageAsDataURL(url: string, timeoutMs = 8000): Promise<string | null> {
    if (!url) return null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(url, { signal: controller.signal, mode: 'cors', cache: 'no-cache' });
      clearTimeout(timer);
      if (!resp.ok) return null;

      const blob = await resp.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string | null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  }
}
