// src/app/models/pedido.model.ts

export interface DetallePedido {
  id: number;
  idProducto: number;
  nombreProducto: string;
  imagenUrl: string;
  talla: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface Pago {
  idPago: number;
  idMedioPago: number;
  montoPagado: number;
  fechaPago: string;
  idTransaccionMP?: string;
  estadoPago: string;
  comprobanteUrl?: string;
}

export interface Cliente {
  idUsuario: number;
  nombreCompleto: string;
  telefono: string;
  email: string;
}

export interface DireccionEntrega {
  idDireccion: number;
  direccion: string;
  referencia?: string;
}

export interface Pedido {
  idVenta: number;
  fecha: string;
  total: number;
  estado: string;
  estadoPago: string;
  costoEnvio: number;
  cliente: Cliente;
  direccionEntrega?: DireccionEntrega;
  detalles: DetallePedido[];
  pagos: Pago[];
}
