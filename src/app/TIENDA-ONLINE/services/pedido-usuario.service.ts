
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from './../../models/pedido.model'; 
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoUsuarioService {

  private apiUrl = `${environment.apiUrl}/Venta`;

  constructor(private http: HttpClient) { }

  getPedidosPorUsuario(idUsuario: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  getPedidoPorId(idVenta: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${idVenta}`);
  }
}
