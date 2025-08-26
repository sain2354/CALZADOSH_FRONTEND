import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TallaProductoService {
  private apiUrl = 'https://www.chbackend.somee.com/api/TallaProducto';

  constructor(private http: HttpClient) {}

  // Obtiene todos los TallaProducto
  getAllTallaProducto(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Crea uno (POST /api/TallaProducto)
  createTallaProducto(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  // Obtiene las tallas asociadas a un producto
  getTallasByProducto(idProducto: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/porProducto/${idProducto}`);
  }

  // Elimina todas las tallas asociadas a un producto
  deleteTallasByProducto(idProducto: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/producto/${idProducto}`);
  }
}