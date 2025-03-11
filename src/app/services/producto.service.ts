import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://www.chbackend.somee.com/api/Producto';


  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtiene productos filtrados por categoría (cat) SIN paginación en el servidor.
   * cat=0 => Todos, cat=1 => Hombres, cat=2 => Mujeres, cat=3 => Infantil
   */
  getAll(cat: number = 0): Observable<Producto[]> {
    const params = new HttpParams().set('cat', cat);
    return this.http.get<Producto[]>(this.apiUrl, { params });
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
