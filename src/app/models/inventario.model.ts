// src/app/models/inventario.model.ts

import { Producto } from './producto.model'; // Asumiendo que ya tienes un modelo Producto

export interface Inventario {
  idInventario?: number; // El '?' indica que es opcional, ya que el backend lo genera
  idProducto: number;
  cantidadInventario: number;
  fechaRegistro: string; // Usaremos string para representar DateOnly del backend por simplicidad en la transferencia HTTP
  tipoMovimiento: string;
  // Si incluyes la navegación a Producto en tus respuestas del backend GET
  idProductoNavigation?: Producto;
}