// src/app/services/pedido.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetallePedido {
  id: number;
  idProducto: number;
  nombreProducto: string; // nuevo
  imagenUrl: string;      // nuevo
  talla: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface Pago {
  idPago: number;
  idVenta: number;
  montoPagado: number;
  fechaPago: string;
  idMedioPago: number;
  idTransaccionMP?: string;
  estadoPago: string;
  comprobanteUrl?: string;
}

export interface Cliente {
  idUsuario: number;
  nombreCompleto: string;
  telefono: string;
  email: string;
}

export interface DireccionEntrega {
  idDireccion: number;
  direccion: string;
  referencia?: string;
}

export interface Pedido {
  idVenta: number;
  fecha: string;
  total: number;
  estado: string;
  estadoPago: string;
  costoEnvio: number;
  cliente: Cliente;
  direccionEntrega?: DireccionEntrega;
  detalles: DetallePedido[];  // ahora vienen con nombreProducto, imagenUrl...
  pagos: Pago[];
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = 'http://www.chbackend.somee.com/api/Venta';

  constructor(private http: HttpClient) {}

  /** Lista todas las ventas (sin detalle de items ni cliente completo) */
  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  eliminarPedido(idVenta: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idVenta}`);
  }

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
