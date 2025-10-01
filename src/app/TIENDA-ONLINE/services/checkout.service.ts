import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// --- INTERFACES (Sin cambios) ---
export interface DetalleVentaRequest { /* ... */ }
export interface DireccionEntregaRequest { /* ... */ }
export interface VentaRequest { /* ... */ }
export interface VentaResponse { /* ... */ }

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  private http = inject(HttpClient);

  // --- INICIO DE LA MODIFICACIÓN ---
  // Se alinea la URL del endpoint con la que espera el backend (`/api/Venta`).
  private apiUrl = `${environment.apiUrl}/Venta`;
  // --- FIN DE LA MODIFICACIÓN ---

  constructor() { }

  crearVenta(ventaData: VentaRequest): Observable<VentaResponse> {
    console.log('Enviando datos a la ruta corregida:', ventaData);
    return this.http.post<VentaResponse>(this.apiUrl, ventaData);
  }
}

// --- Repetición de interfaces para completitud del archivo ---
// (El contenido de las interfaces no cambia)

export interface DetalleVentaRequest {
  idProducto: number;
  idTalla: number;
  cantidad: number;
  precioUnitario: number;
}

export interface DireccionEntregaRequest {
  alias?: string;
  nombreDestinatario: string;
  apellidoDestinatario: string;
  dniDestinatario: string;
  telefonoDestinatario: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia?: string;
  costoEnvio: number;
}

export interface VentaRequest {
  idUsuario: number;
  tipoComprobante: string;
  direccionEntrega: DireccionEntregaRequest | null;
  detallesVenta: DetalleVentaRequest[];
  total: number;
  subtotal: number;
  igv: number;
}

export interface VentaResponse {
  idVenta: number;
  mensaje: string;
  urlPasarela?: string;
}
