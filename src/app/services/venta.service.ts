// src/app/services/venta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta } from '../models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = 'http://www.chbackend.somee.com/api/Venta'; // Ajusta a tu URL real

  constructor(private http: HttpClient) {}

  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  getVentaById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  createVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta);
  }

  updateVenta(id: number, venta: Venta): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}/${id}`, venta);
  }

  deleteVenta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
