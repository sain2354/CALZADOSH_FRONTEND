import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Talla } from '../models/talla.model';

@Injectable({
  providedIn: 'root'
})
export class TallaService {
  private apiUrl = 'http://www.chbackend.somee.com/api/Talla';

  constructor(private http: HttpClient) {}

  /** 
   * Devuelve todas las tallas o, si se le pasa categoría, solo las de esa categoría.
   */
  getTallas(categoria?: string): Observable<Talla[]> {
    // Escapa espacios u otros caracteres especiales
    const params = categoria
      ? `?categoria=${encodeURIComponent(categoria.trim())}`
      : '';
    return this.http.get<Talla[]>(`${this.apiUrl}${params}`);
  }
}

