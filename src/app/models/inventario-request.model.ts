// src/app/models/inventario-request.model.ts

export interface InventarioRequest {
  idProducto: number;
  cantidadInventario: number;
  fechaRegistro: string; // Usaremos string para representar DateOnly del backend
  tipoMovimiento: string;
}
