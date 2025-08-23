import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario } from '../models/inventario.model';
import { InventarioRequest } from '../models/inventario-request.model';
import { InventarioResumenResponse } from '../models/inventario-resumen-response.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://www.chbackend.somee.com/api/Inventario'; // **AJUSTA ESTA URL SI ES NECESARIO**

  constructor(private http: HttpClient) { }

  obtenerInventario(idProducto?: number, fecha?: string): Observable<Inventario[]> {
    let params: any = {};
    if (idProducto) {
      params.idProducto = idProducto;
    }
    if (fecha) {
      params.fecha = fecha;
    }
    return this.http.get<Inventario[]>(this.apiUrl, { params });
  }

  crearInventario(inventarioRequest: InventarioRequest): Observable<any> {
    return this.http.post(this.apiUrl, inventarioRequest);
  }

  obtenerStockActualProducto(idProducto: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stock/${idProducto}`);
  }

  obtenerResumenInventario(): Observable<InventarioResumenResponse[]> {
    return this.http.get<InventarioResumenResponse[]>(`${this.apiUrl}/resumen`);
  }
}
