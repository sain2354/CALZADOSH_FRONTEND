// src/app/TIENDA-ONLINE/cart/cart.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cartItems$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;

  constructor(
    public cartService: CartService,
    public productService: ProductService // Para obtener la URL de la imagen
  ) { 
    // Inicializamos los observables directamente desde el servicio
    this.cartItems$ = this.cartService.getCartItems();
    this.totalPrice$ = this.cartService.getTotalPrice();
  }

  ngOnInit(): void {
    // Los observables se manejarán en la plantilla con el pipe | async
  }

  /**
   * Llama al servicio para eliminar un item del carrito.
   * @param cartItemId El ID único del item en el carrito.
   */
  onRemoveItem(cartItemId: string): void {
    this.cartService.removeFromCart(cartItemId);
  }

  /**
   * Llama al servicio para actualizar la cantidad de un item.
   * @param cartItemId El ID único del item en el carrito.
   * @param newQuantity La nueva cantidad deseada.
   */
  onUpdateQuantity(cartItemId: string, newQuantity: number): void {
    if (newQuantity > 0) {
      this.cartService.updateQuantity(cartItemId, newQuantity);
    }
  }

  /**
   * Rastreador para el *ngFor, mejora el rendimiento al re-renderizar la lista.
   */
  trackByCartItemId(index: number, item: CartItem): string {
    return item.id;
  }
}
