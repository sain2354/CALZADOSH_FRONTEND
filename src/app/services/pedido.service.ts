// src/app/services/pedido.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = 'http://www.chbackend.somee.com/api/Venta';

  constructor(private http: HttpClient) {}

  /** Lista todas las ventas (sin detalle de items ni cliente completo) */
  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  /** Elimina un pedido por su ID */
  eliminarPedido(idVenta: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idVenta}`);
  }

  /** Cambia el estado de un pedido */
  cambiarEstado(idVenta: number, nuevoEstado: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${idVenta}/estado`,
      JSON.stringify({ nuevoEstado }),
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  /** Trae el detalle completo de un pedido, incluyendo cliente, items, fotos, pagos, etc. */
  getDetallePedido(idVenta: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${idVenta}/detalle`);
  }
}
