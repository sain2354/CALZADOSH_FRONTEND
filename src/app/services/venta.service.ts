// src/app/services/venta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaDetalleResponse } from '../models/venta-detalle-response.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = 'https://www.chbackend.somee.com/api/Venta';

  constructor(private http: HttpClient) {}

  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getVentaById(id: number): Observable<VentaDetalleResponse> {
    return this.http.get<VentaDetalleResponse>(`${this.apiUrl}/${id}`);
  }

  createVenta(venta: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, venta);
  }

  updateVenta(id: number, venta: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, venta);
  }

  deleteVenta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
