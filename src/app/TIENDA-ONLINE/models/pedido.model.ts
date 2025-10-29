
// src/app/TIENDA-ONLINE/models/pedido.model.ts

/**
 * Representa el detalle de un producto específico dentro de un pedido.
 */
export interface DetallePedido {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  nombreProducto: string; // Nombre del producto para fácil visualización
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  imagenUrl?: string; // URL de la imagen del producto (opcional)
}

/**
 * Representa un pedido completo realizado por un usuario.
 */
export interface Pedido {
  idPedido: number;
  fechaPedido: string; // Se puede usar string (ISO 8601) o Date
  estado: 'Pendiente' | 'Confirmado' | 'Enviado' | 'Entregado' | 'Cancelado';
  total: number;
  idCliente: number; // Para asociar el pedido a un usuario
  detalles: DetallePedido[]; // Un array con todos los productos del pedido
}
