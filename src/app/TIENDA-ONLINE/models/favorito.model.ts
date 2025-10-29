// src/app/TIENDA-ONLINE/models/favorito.model.ts

/**
 * Representa la relación simple entre un usuario y un producto favorito.
 * Esta es la estructura que se envía al backend al agregar/quitar un favorito.
 */
export interface Favorito {
  idFavorito?: number; // El ID de la relación, puede ser útil.
  idUsuario: number;
  idProducto: number;
  fechaAgregado?: Date; // Opcional, por si quieres registrar cuándo se agregó.
}

/**
 * Representa un producto favorito con todos sus detalles para mostrarlo en la UI.
 * Se espera que el backend devuelva una lista de estos al consultar los favoritos de un usuario.
 */
export interface ProductoFavorito {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOriginal?: number; // Por si hay ofertas
  imagenUrl: string;
  // Puedes añadir cualquier otro campo que consideres relevante para mostrar en la lista de favoritos.
  // Por ejemplo, la marca, la categoría, etc.
}
