import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Categoria } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  // Ajusta la URL a tu backend real
  private apiUrl = 'https://www.chbackend.somee.com/api/Categoria';

  constructor(private http: HttpClient) {}

  // Obtener todas las categorías
  getAll(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  /**
   * Crear nueva categoría.
   * Tu backend responde: { mensaje: '...', data: { ...categoriaCreada } }
   * Aquí mapeamos para devolver solo la data (Categoria).
   */
  create(categoria: { descripcion: string }): Observable<Categoria> {
    return this.http.post<any>(this.apiUrl, categoria).pipe(
      map((res: any) => {
        // Si backend devuelve data en res.data — lo devolvemos; si no, devolvemos res directamente
        return (res && res.data) ? (res.data as Categoria) : (res as Categoria);
      })
    );
  }

  /**
   * Actualizar categoría por id.
   * Tu backend responde: { mensaje: '...', data: { ...categoriaActualizada } }
   * Mapeamos para devolver la data (Categoria).
   */
  update(idCategoria: number, categoria: { descripcion: string }): Observable<Categoria> {
    return this.http.put<any>(`${this.apiUrl}/${idCategoria}`, categoria).pipe(
      map((res: any) => {
        return (res && res.data) ? (res.data as Categoria) : (res as Categoria);
      })
    );
  }

  /**
   * Eliminar categoría por idCategoria.
   * El backend responde { mensaje: 'Categoría eliminada correctamente.' }
   * Devolvemos el Observable<any> para que el componente gestione la respuesta.
   */
  delete(idCategoria: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idCategoria}`);
  }
}
