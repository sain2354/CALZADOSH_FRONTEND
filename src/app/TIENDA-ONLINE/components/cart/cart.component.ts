import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

// --- INICIO DE LA MODIFICACIÓN ---
// Se importa también el tipo de respuesta del usuario del backend
import { AuthTiendaService, UserBackendResponse } from '../../services/auth-tienda.service';
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
  private authService = inject(AuthTiendaService);

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
    // Se usa `currentUser$` en lugar de `user$` y se añade el tipo explícito al callback.
    this.authService.currentUser$.pipe(
      take(1)
    ).subscribe((user: UserBackendResponse | null) => {
      this.onClose();

      if (user) {
        console.log('Usuario autenticado. Navegando a /checkout');
        this.router.navigate(['/checkout']);
      } else {
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
