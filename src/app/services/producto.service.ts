import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
   * Obtener productos, filtrados por categoría (cat).
   * Hacemos 'cat' opcional y si no llega nada, usamos '0' por defecto.
   * Con baseUrl ya apuntando a /api/Producto, solo añadimos ?cat=
   */
  getAll(cat?: number): Observable<Producto[]> {
    const catParam = cat ?? 0; // Si cat es undefined/null, usa 0
    return this.http.get<Producto[]>(`${this.baseUrl}?cat=${catParam}`);
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
   * (No lo uses si quieres subir imagen como archivo).
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
