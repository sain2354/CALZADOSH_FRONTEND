import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  // Ajusta la URL a tu backend real
  private apiUrl = 'http://www.chbackend.somee.com/api/Categoria';

  constructor(private http: HttpClient) {}

  // Obtener todas las categorías
  getAll(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  // Crear nueva categoría
  create(categoria: { descripcion: string }): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  // Eliminar categoría por idCategoria
  delete(idCategoria: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCategoria}`);
  }
}
