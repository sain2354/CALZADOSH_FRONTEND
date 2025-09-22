// src/app/TIENDA-ONLINE/models/producto-tienda.model.ts

/**
 * Define la estructura de las opciones de talla para un producto de la tienda.
 * CORRECCIÓN DEFINITIVA: Las propiedades coinciden con la respuesta de la API (usa, eur, cm).
 */
export interface SizeOption {
  idTalla?: number;
  idProducto?: number;
  usa?: number;
  eur?: number;
  cm?: number;
  stock: number;
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
  
  // Campos de Categoría y Marca
  idCategoria: number;
  categoriaDescripcion?: string;
  idSubCategoria?: number;
  subCategoriaDescripcion: string;
  marca?: string;

  // Tallas del producto (el servicio mapea "sizes" de la API a esta propiedad)
  tallas: SizeOption[];
  
  // Otros campos detallados
  mpn?: string;
  shippingInfo?: string;
  material?: string;
  color?: string;
}
