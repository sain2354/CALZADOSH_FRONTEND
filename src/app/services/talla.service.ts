import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Talla } from '../models/talla.model';

@Injectable({
  providedIn: 'root'
})
export class TallaService {
  private apiUrl = 'https://localhost:5001/api/Talla';

  constructor(private http: HttpClient) {}

  // Retorna TODAS las tallas (GET /api/Talla)
  getAllTallas(): Observable<Talla[]> {
    return this.http.get<Talla[]>(this.apiUrl);
  }

  // Crea una talla (POST /api/Talla)
  createTalla(tallaRequest: { descripcion: string }): Observable<Talla> {
    return this.http.post<Talla>(this.apiUrl, tallaRequest);
  }

  // Elimina una talla (DELETE /api/Talla/{idTalla})
  deleteTalla(idTalla: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idTalla}`);
  }

  /*
  // COMENTADO/ELIMINADO: getTallasByProducto
  // Porque en tu backend NO existe /porProducto/{idProducto}
  getTallasByProducto(idProducto: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/porProducto/${idProducto}`);
  }
  */
}
