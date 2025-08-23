export interface ItemCompra {
  // Propiedades para enviar al backend (request)
  idProducto: number;
  idTalla: number;
  cantidad: number;
  precioUnitario: number;

  // Propiedades que podrías recibir del backend (response - en detalle de compra)
  idDetalleCompra?: number; // Opcional, generado por el backend
  nombreProducto?: string; // Incluido en response para detalle
  nombreTalla?: string; // Incluido en response para detalle
  subtotalItem?: number; // Incluido en response para detalle (Cantidad * PrecioUnitario)
}
