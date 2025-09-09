// src/app/models/venta-detalle-response.model.ts

import { DetalleVentaDetalle } from './detalle-venta-detalle.model'; // Importar la interfaz para los detalles
// Importar las interfaces reutilizadas de pedido.model.ts
import { Cliente, DireccionEntrega, Pago } from './pedido.model';


export interface VentaDetalleResponse {
    idVenta: number;
    fecha: string; // O Date si la parseas al recibir del backend
    total: number;
    estado: string;
    estadoPago: string;
    costoEnvio: number;
    metodoEntrega: string;
    sucursalRecoge?: string;

    // Propiedades que vienen de la relación con Venta en el backend
    tipoComprobante?: string;
    serie?: string;
    numeroComprobante?: string;
    totalIgv?: number;

    // Propiedades que vienen de las relaciones incluidas en el backend
    cliente?: Cliente; // *** Mantenido por si la API se actualiza ***
    direccionEntrega?: DireccionEntrega; 
    detalles: DetalleVentaDetalle[]; 
    pagos?: Pago[]; // *** Mantenido por si la API se actualiza ***

    // Propiedades que probablemente sí vienen en la respuesta de la API
    clienteNombre?: string;
    formaPago?: string;
}
