import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Ajusta a la URL real de tu backend
  private apiUrl = 'https://localhost:5001/api/Producto';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getById(idProducto: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${idProducto}`);
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto, this.httpOptions);
  }

  updateProducto(idProducto: number, producto: Producto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idProducto}`, producto, this.httpOptions);
  }

  deleteProducto(idProducto: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idProducto}`);
  }
}
