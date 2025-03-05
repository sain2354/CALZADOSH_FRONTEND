export interface Producto {
  idProducto?: number;       // <-- en lugar de "id?"
  codigoBarra?: string;
  categoria?: string;
  nombre: string;
  precioCompra?: number;
  precioVenta?: number;
  stock?: number;
  minStock?: number;
  estado?: boolean;
  idCategoria?: number;
  idSubCategoria?: number;
  stockMinimo?: number;
  idUnidadMedida?: number;
  foto?: string;
}
