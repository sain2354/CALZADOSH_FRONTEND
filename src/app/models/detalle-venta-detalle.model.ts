// src/app/models/detalle-venta-detalle.model.ts

export interface DetalleVentaDetalle {
    id: number;
    idVenta: number; // Puede que no lo necesites en el frontend, pero lo incluyo si está en la respuesta
    idProducto: number;
    cantidad: number;
    precio: number;
    descuento?: number;
    total: number;
    idUnidadMedida?: number; // Puede que no lo necesites en el frontend
    igv?: number;

    // Propiedades que vienen de la navegación a Producto y TallaProducto
    nombreProducto: string; // Descripción del producto
    imagenUrl: string;
    talla: string; // Talla formateada (USA/EUR/CM)
}
