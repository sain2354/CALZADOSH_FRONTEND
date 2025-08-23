export interface InventarioResumenResponse {
  idProducto: number;
  codigo: string;
  descripcion: string;
  ingresos: number;
  salidas: number;
  stock: number;
}