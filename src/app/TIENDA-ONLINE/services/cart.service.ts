import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ProductoTienda, SizeOption } from '../models/producto-tienda.model';

export interface CartItem {
  id: string; // ID único: `productoId-tallaUsa`
  product: ProductoTienda;
  selectedSize: SizeOption;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public idUsuario: number | null = null; // ID del usuario asociado al carrito

  constructor() {
    const storedCart = localStorage.getItem('shopping_cart');
    if (storedCart) {
      this.cartItems.next(JSON.parse(storedCart));
    }
  }

  // ========= OBSERVABLES PÚBLICOS =========

  /** Observable del array completo de items en el carrito. */
  getCartItems(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  /** Observable del número total de productos en el carrito. */
  getCartItemCount(): Observable<number> {
    return this.cartItems.pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  /** Observable del precio total del carrito. */
  getTotalPrice(): Observable<number> {
    return this.cartItems.pipe(
      map(items => items.reduce((total, item) => total + (item.product.precioVenta * item.quantity), 0))
    );
  }

  // ========= ACCIONES DEL CARRITO =========

  /**
   * Asocia el carrito actual a un ID de usuario.
   * Esto es crucial para guardar/recuperar el carrito desde un backend.
   * Por ahora, solo lo guardamos en memoria.
   * @param idUsuario El ID del usuario que ha iniciado sesión.
   */
  asociarUsuarioAlCarrito(idUsuario: number): void {
    this.idUsuario = idUsuario;
    console.log(`Carrito asociado al usuario con ID: ${idUsuario}.`);
    // Aquí se podría añadir lógica para guardar el carrito en el backend
    // o moverlo de un localStorage de "invitado" a uno de "usuario".
  }

  /**
   * Añade un producto y su talla al carrito. Si ya existe, incrementa la cantidad.
   */
  addToCart(product: ProductoTienda, selectedSize: SizeOption): void {
    const currentItems = this.cartItems.getValue();
    const cartItemId = `${product.idProducto}-${selectedSize.usa}`;
    const existingItem = currentItems.find(item => item.id === cartItemId);

    if (existingItem) {
      // Aumenta la cantidad si el producto ya está en el carrito
      this.updateQuantity(cartItemId, existingItem.quantity + 1);
    } else {
      // Añade el nuevo producto si no existe
      const newItem: CartItem = { id: cartItemId, product, selectedSize, quantity: 1 };
      this.updateCart([...currentItems, newItem]);
    }
  }

  /**
   * Actualiza la cantidad de un item específico en el carrito.
   * La cantidad se ajusta para estar entre 1 y el stock disponible.
   */
  updateQuantity(cartItemId: string, newQuantity: number): void {
    const currentItems = this.cartItems.getValue();
    const itemIndex = currentItems.findIndex(item => item.id === cartItemId);

    if (itemIndex > -1) {
      const itemToUpdate = currentItems[itemIndex];
      // Asegura que la cantidad no sea menor que 1 ni mayor que el stock
      const newClampedQuantity = Math.max(1, Math.min(newQuantity, itemToUpdate.selectedSize.stock));
      
      currentItems[itemIndex] = { ...itemToUpdate, quantity: newClampedQuantity };
      this.updateCart([...currentItems]);
    }
  }

  /**
   * Elimina un item completo del carrito, sin importar su cantidad.
   */
  removeFromCart(cartItemId: string): void {
    const currentItems = this.cartItems.getValue();
    const filteredItems = currentItems.filter(item => item.id !== cartItemId);
    this.updateCart(filteredItems);
  }

  /**
   * Vacía completamente el carrito de compras.
   */
  clearCart(): void {
    this.updateCart([]);
  }

  // ========= MÉTODOS PRIVADOS =========

  /**
   * Método central para actualizar el estado del carrito y persistirlo.
   */
  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    localStorage.setItem('shopping_cart', JSON.stringify(items));
    console.log('Carrito actualizado en el servicio:', this.cartItems.getValue());
  }
}
