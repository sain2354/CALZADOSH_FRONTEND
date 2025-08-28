// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface DashboardResumen {
  totalProductos: number;
  totalVentas: number;
  totalCompras: number;
  totalGanancias: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface VentaPorMes {
  año: number;
  mes: number;
  totalVentas: number;
  cantidadVentas: number;
}

export interface CompraPorMes {
  año: number;
  mes: number;
  totalCompras: number;
  cantidadCompras: number;
}

export interface EstadisticasDashboard {
  ventasPorMes: VentaPorMes[];
  comprasPorMes: CompraPorMes[];
  fechaInicio: string;
  fechaFin: string;
}

export interface TopProducto {
  idProducto: number;
  nombreProducto: string;
  cantidadVendida: number;
  totalVentas: number;
}

export interface ProveedorStats {
  idProveedor: number;
  nombreProveedor: string;
  totalCompras: number;
  cantidadCompras: number;
}

export interface ResumenFinancieroMensual {
  tipo: string;
  total: number;
  fechaInicio: string;
  fechaFin: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'https://www.chbackend.somee.com/api';

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('Error en DashboardService:', error);
    return throwError(() => new Error('Error al conectar con el servidor'));
  }

  getResumenDashboard(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.apiUrl}/Dashboard/resumen`)
      .pipe(catchError(this.handleError));
  }

  getEstadisticas(meses: number = 6): Observable<EstadisticasDashboard> {
    const params = new HttpParams().set('meses', meses.toString());
    return this.http.get<EstadisticasDashboard>(`${this.apiUrl}/Dashboard/estadisticas`, { params })
      .pipe(catchError(this.handleError));
  }

  getVentasPorMes(meses: number = 6): Observable<VentaPorMes[]> {
    const params = new HttpParams().set('meses', meses.toString());
    return this.http.get<VentaPorMes[]>(`${this.apiUrl}/Venta/ventas-por-mes`, { params })
      .pipe(catchError(this.handleError));
  }

  getComprasPorMes(meses: number = 6): Observable<CompraPorMes[]> {
    const params = new HttpParams().set('meses', meses.toString());
    return this.http.get<CompraPorMes[]>(`${this.apiUrl}/Compra/compras-por-mes`, { params })
      .pipe(catchError(this.handleError));
  }

  // Nuevos métodos
  getResumenMensualDetallado(fechaInicio: Date, fechaFin: Date): Observable<ResumenFinancieroMensual[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    
    return this.http.get<ResumenFinancieroMensual[]>(`${this.apiUrl}/Dashboard/resumen-mensual-detallado`, { params })
      .pipe(catchError(this.handleError));
  }

  getTopProductos(cantidad: number = 5, fechaInicio?: Date, fechaFin?: Date): Observable<TopProducto[]> {
    let params = new HttpParams().set('cantidad', cantidad.toString());
    
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio.toISOString());
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin.toISOString());
    }
    
    return this.http.get<TopProducto[]>(`${this.apiUrl}/Dashboard/top-productos`, { params })
      .pipe(catchError(this.handleError));
  }

  getEstadisticasProveedores(fechaInicio: Date, fechaFin: Date): Observable<ProveedorStats[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    
    return this.http.get<ProveedorStats[]>(`${this.apiUrl}/Dashboard/estadisticas-proveedores`, { params })
      .pipe(catchError(this.handleError));
  }
}