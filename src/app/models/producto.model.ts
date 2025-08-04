// src/app/models/producto.model.ts
export interface Producto {
  idProducto?: number;
  codigoBarra?: string; // Corrected typo
  categoria?: string;
  nombre: string;
  precioCompra?: number;
  precioVenta: number;
  stock: number;
  minStock?: number;
  estado: boolean;
  idCategoria?: number;
  idSubCategoria?: number;
  stockMinimo?: number;
  idUnidadMedida?: number;
  foto?: string;
  mpn?: string;
  shippingInfo?: string;
  material?: string;
  color?: string;
  genero?: string; // Added
  articulo?: string; // Added
  estilo?: string; // Added
  sizes: SizeWithStock[]; // Assuming this structure for sizes
  // --- Campos para Promoción (Variante INLINE) ---
  asignarPromocion?: boolean; // Indicates if a promotion is assigned
  promocion?: Promocion; // Promotion details
}

export interface SizeWithStock {
  idTalla?: number;
  usa?: string;
  eur?: string;
  cm?: string;
  stock: number;
}

export interface Promocion {
  idPromocion?: number;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipoDescuento: string; // 'Porcentaje' or 'Fijo'
  descuento: number;
  idProductos?: number[];
}

// Assuming this is also part of your model based on usage
export interface Categoria {
  id: number;
  nombre: string;
}

export interface Talla {
  idTalla?: number;
  usa?: string;
  eur?: string;
  cm?: string;
  categoria?: string; // Assuming talla can be associated with a category
}