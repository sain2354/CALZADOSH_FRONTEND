export interface Producto {
  idProducto?: number;
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

  // — Nuevos campos —
  mpn?: string;
  shippingInfo?: string;
  material?: string;
  color?: string;
}
