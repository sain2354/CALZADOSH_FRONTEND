// src/app/models/compra.model.ts

// Puedes mantener tus interfaces de request si las usas en ingresar.component.ts
export interface ItemCompraRequest {
    idProducto: number;
    idTalla: number; // Ojo: En el backend usamos este como el ID de la Talla Maestra
    cantidad: number;
    precioUnitario: number;
}

export interface CompraRequest {
    tipoDocumento: string;
    numeroDocumento: string;
    idProveedor: number;
    idFormaPago: number;
    itemsCompra: ItemCompraRequest[];
    serie?: string;
}

// Interfaz para el resumen de la compra (respuesta de GET /api/Compras)
export interface CompraResponse {
    idCompra: number;
    fechaCompra: string; // O Date
    tipoDocumento: string;
    numeroDocumento: string;
    formaPago: string;
    nombreProveedor: string;
    total: number;
    // usuario?: string;
    // estado?: string;
}

// Interfaz para el detalle de un ítem dentro de la compra detallada
export interface ItemCompraDetalleResponse {
    idProducto: number;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    idTalla: number;
    nombreTalla: string;
    stock: number;
}

// Interfaz para los detalles completos de una compra
export interface CompraDetalleResponse {
    idCompra: number;
    fechaCompra: string; // O Date
    tipoDocumento: string;
    numeroDocumento: string;
    formaPago: string;
    nombreProveedor: string;
    subtotal: number;
    igv: number;
    total: number;
    itemsCompra: ItemCompraDetalleResponse[];
    // usuario?: string;
    // estado?: string;
    serie?: string;
}

// Si aún usas las interfaces originales para el formulario de ingreso:
export interface ItemCompra {
    idProducto: number;
    idTalla: number;
    cantidad: number;
    precioUnitario: number;
    codigoBarra?: string;
    nombreProducto?: string;
    nombreTalla?: string;
    stock?: number;
    subtotalItem?: number;
}

export interface Compra {
    fecha?: string;
    tipoDocumento: string;
    numeroDocumento: string;
    idProveedor: number;
    idFormaPago: number;
    subtotal: number;
    igv: number;
    total: number;
    items: ItemCompra[];

    idCompra?: number;
    nombreProveedor?: string;
    formaPago?: string;
    serie?: string;
}
