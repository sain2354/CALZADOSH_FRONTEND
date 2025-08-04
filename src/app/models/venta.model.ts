// src/app/models/venta.model.ts

export interface Venta {
  /** El back puede devolver este campo */
  idVenta?: number;

  /** Para el backend será el mismo que idPersona */
  idUsuario?: number;

  /** Relacionado a tu tabla Persona */
  idPersona: number;

  /** “Boleta” o “Factura” */
  tipoComprobante?: string;

  /** ISO string o Date */
  fecha: string;

  /** Total sin IGV ni descuentos */
  total: number;

  /** Por ejemplo: 'Emitido' */
  estado: string;

  /** Serie asignada (“B001”/“F001”) */
  serie?: string;

  /** Número correlativo (p.ej. “00000001”) */
  numeroComprobante?: string;

  /** Monto del IGV */
  totalIgv?: number;

  /** Detalle de la venta */
  detalleVenta?: DetalleVenta[];
}

export interface DetalleVenta {
  /** (Opcional) ID interno */
  id?: number;

  /** (Opcional) Se asigna al crear la venta */
  idVenta?: number;

  /** Referencia al producto */
  idProducto: number;

  /** Cantidad vendida */
  cantidad: number;

  /** Precio unitario */
  precio: number;

  /** Descuento aplicado (opcional) */
  descuento?: number;

  /** total = cantidad * precio - descuento */
  total: number;

  /** IGV correspondiente */
  igv?: number;
}
