import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthTiendaService, UserBackendResponse } from '../../services/auth-tienda.service';

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
  subtotal$: Observable<number>;
  shippingCost$: Observable<number>;
  totalPrice$: Observable<number>;

  private router = inject(Router);
  private authService = inject(AuthTiendaService);

  constructor(
    public cartService: CartService,
    public productService: ProductService
  ) { 
    this.cartItems$ = this.cartService.getCartItems();
    this.subtotal$ = this.cartService.getSubtotal();
    this.shippingCost$ = this.cartService.getShippingCost();
    this.totalPrice$ = this.cartService.getTotalPrice();
  }

  proceedToCheckout(): void {
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
