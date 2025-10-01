import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

// --- INICIO DE LA MODIFICACIÓN ---
// 1. Importamos el servicio de autenticación para saber si el usuario está logueado.
import { AuthTiendaService } from '../../services/auth-tienda.service';
// --- FIN DE LA MODIFICACIÓN ---

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {

  @Output() close = new EventEmitter<void>();

  cartItems$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;

  private router = inject(Router);
  // --- INICIO DE LA MODIFICACIÓN ---
  // 2. Inyectamos el servicio de autenticación.
  private authService = inject(AuthTiendaService);
  // --- FIN DE LA MODIFICACIÓN ---

  constructor(
    public cartService: CartService,
    public productService: ProductService
  ) { 
    this.cartItems$ = this.cartService.getCartItems();
    this.totalPrice$ = this.cartService.getTotalPrice();
  }

  /**
   * Controla el flujo de "Finalizar Compra".
   * Verifica si el usuario está autenticado antes de navegar.
   */
  proceedToCheckout(): void {
    // --- INICIO DE LA MODIFICACIÓN ---
    // 3. Usamos el servicio de autenticación para tomar una decisión.
    this.authService.user$.pipe(
      take(1) // Tomamos solo el valor actual y nos desuscribimos.
    ).subscribe(user => {
      this.onClose(); // Cerramos el panel del carrito en cualquier caso.

      if (user) {
        // Si hay un usuario, está logueado. Lo llevamos a la página de checkout.
        console.log('Usuario autenticado. Navegando a /checkout');
        this.router.navigate(['/checkout']);
      } else {
        // Si no hay usuario, lo llevamos a la página de autenticación.
        console.log('Usuario no autenticado. Navegando a /auth');
        this.router.navigate(['/auth']);
      }
    });
    // --- FIN DE LA MODIFICACIÓN ---
  }

  onClose(): void {
    this.close.emit();
  }

  onRemoveItem(cartItemId: string): void {
    this.cartService.removeFromCart(cartItemId);
  }

  onUpdateQuantity(cartItemId: string, newQuantity: number): void {
    if (newQuantity > 0) {
      this.cartService.updateQuantity(cartItemId, newQuantity);
    }
  }

  trackByCartItemId(index: number, item: CartItem): string {
    return item.id;
  }
}
