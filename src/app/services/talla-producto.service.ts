import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TallaProductoService {
  private apiUrl = 'https://localhost:5001/api/TallaProducto';

  constructor(private http: HttpClient) {}

  // Obtiene todos los TallaProducto
  getAllTallaProducto(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Crea uno (POST /api/TallaProducto)
  createTallaProducto(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  // NUEVO: Obtiene las tallas asociadas a un producto (GET /api/TallaProducto/porProducto/{idProducto})
  getTallasByProducto(idProducto: number): Observable<any[]> {
    // Ajusta la ruta a tu backend (TallaProductoController con [HttpGet("porProducto/{idProducto}")])
    return this.http.get<any[]>(`${this.apiUrl}/porProducto/${idProducto}`);
  }
}
