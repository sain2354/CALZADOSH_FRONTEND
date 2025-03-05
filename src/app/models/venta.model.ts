// src/app/models/venta.model.ts

export interface Venta {
  idVenta?: number;
  idPersona: number;         // Relacionado a tu tabla Persona
  tipoComprobante?: string;
  fecha: string;             // Puedes usar string o Date
  total: number;
  estado: string;            // Por ejemplo: 'Emitido'
  serie?: string;
  numeroComprobante?: string;
  totalIgv?: number;
  // Detalle de la venta
  detalleVenta?: DetalleVenta[];
}

export interface DetalleVenta {
  id?: number;
  idVenta?: number;
  idProducto: number;
  cantidad: number;
  precio: number;            // Asegúrate de usar 'precio' también en tu componente
  descuento?: number;
  total: number;             // cantidad * precio (menos descuento, si aplica)
  igv?: number;
}
