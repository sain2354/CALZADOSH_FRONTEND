// src/app/TIENDA-ONLINE/models/producto-tienda.model.ts

/**
 * Define la estructura de las opciones de talla para un producto de la tienda.
 */
export interface SizeOption {
  idTallaUsa?: number;
  usa?: number;
  eur?: number;
  cm?: number;
  stock: number; // El stock es importante aquí, lo hacemos no opcional.
}

/**
 * Define la estructura de un objeto Producto tal como lo devuelve la API pública
 * para ser mostrado en la tienda online.
 */
export interface ProductoTienda {
  // Campos principales
  idProducto: number;
  nombre: string;
  precioVenta: number;
  stock: number; // Stock general del producto (si no tiene tallas)
  foto: string;
  
  // Campos de Categoría y Marca (NUEVO: Añadidos para corregir errores)
  idCategoria: number;
  categoriaDescripcion?: string; // NUEVO
  idSubCategoria?: number;
  subCategoriaDescripcion: string;
  marca?: string; // NUEVO

  // Tallas del producto (NUEVO: Renombrado de tallaProducto a tallas para consistencia)
  tallas: SizeOption[];
  
  // Otros campos detallados
  mpn?: string;
  shippingInfo?: string;
  material?: string;
  color?: string;
}
