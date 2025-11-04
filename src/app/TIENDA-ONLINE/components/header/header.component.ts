import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UserBackendResponse } from '../../services/auth-tienda.service';
import { CartComponent } from '../cart/cart.component';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { AuthTiendaService } from '../../services/auth-tienda.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CartComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  // Se convierte searchTerm en un getter/setter para controlar los cambios
  private _searchTerm: string = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(value: string) {
    this._searchTerm = value;
    this.searchSubject.next(value);
  }

  selectedCategoryName: string | null = 'Todos';
  currentUser$: Observable<UserBackendResponse | null>;
  cartItemCount$: Observable<number>;
  
  isUserMenuOpen = false;
  isCartVisible = false;

  private subs = new Subscription();
  private searchSubject = new Subject<string>();

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private authService: AuthTiendaService,
    private cartService: CartService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.cartItemCount$ = this.cartService.getCartItemCount();

    this.subs.add(
      this.categoryService.selectedCategory$.subscribe(name => {
        this.selectedCategoryName = name ?? 'Todos';
      })
    );
  }

  ngOnInit(): void {
    // Escucha los cambios en el término de búsqueda con un retraso
    this.subs.add(
      this.searchSubject.pipe(
        debounceTime(300), // Espera 300ms después de la última pulsación
        distinctUntilChanged() // Solo emite si el valor ha cambiado
      ).subscribe(searchValue => {
        this.productService.setSearchTerm(searchValue);
        if (searchValue && this.router.url !== '/') {
          this.router.navigate(['/']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  selectCategory(name: string): void {
    this.categoryService.setCategory(name);
    
    const categoryMap: { [key: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
    const categoryId = categoryMap[name];

    this.productService.setCategory(categoryId);
    this.router.navigate(['/']);
  }

  onHoverCategory(category: string | null): void {
    // Función de compatibilidad con la plantilla
  }

  // El método onSearch() ya no es el principal, pero se mantiene como fallback
  // por si el usuario presiona Enter o hace clic en un botón de búsqueda.
  onSearch(): void {
    this.productService.setSearchTerm(this.searchTerm);
    if (this.router.url !== '/') {
      this.router.navigate(['/']);
    } 
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  goToLogin(): void {
    this.toggleUserMenu();
    this.router.navigate(['/auth']);
  }

  onSignOut(): void {
    this.authService.signOut().then(() => {
      this.toggleUserMenu();
      this.router.navigate(['/auth']);
    });
  }

  setCartVisible(visible: boolean): void {
    this.isCartVisible = visible;
  }
}
