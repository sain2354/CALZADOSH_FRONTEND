import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { User } from 'firebase/auth';

// Servicios
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { SubcategoryService } from '../../services/subcategory.service';
import { ProductService } from '../../services/product.service'; 
import { AuthTiendaService, UserBackendResponse } from '../../services/auth-tienda.service';

// Modelos y Componentes
import { Subcategory } from '../../models/subcategory';
import { CartComponent } from '../cart/cart.component';

@Component({
  selector: 'app-layout-tienda',
  standalone: true,
  imports: [ CommonModule, RouterModule, FormsModule, CartComponent ],
  templateUrl: './layout-tienda.component.html',
  styleUrls: ['./layout-tienda.component.css']
})
export class LayoutTiendaComponent implements OnInit, OnDestroy {

  cartItemCount$: Observable<number>;
  selectedCategoryName = 'Todos';
  subcategories: Subcategory[] = [];
  hoveredBrands: Subcategory[] = [];
  hoveredCategoryName: string | null = null;
  loadingBrands = false;
  searchTerm = '';

  marcasList: string[] = ['Nike', 'Adidas', 'Puma', 'I-Run', 'Reebok'];
  selectedBrandName: string | null = null;
  activeFilters: any = {};
  isCartVisible = false;
  private subs: Subscription[] = [];
  
  public currentUser$: Observable<UserBackendResponse | null>;
  isUserMenuOpen = false;

  constructor(
    private cartService: CartService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
    private productService: ProductService,
    private router: Router,
    private authService: AuthTiendaService
  ) {
    this.cartItemCount$ = this.cartService.getCartItemCount();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.subs.push(this.productService.filters$.subscribe(f => { this.activeFilters = f || {}; }));
    this.subs.push(this.categoryService.selectedCategory$.subscribe((name: string | null) => { if (name) this.selectedCategoryName = name; }));
    const prec = this.subcategoryService.getSubcategories().subscribe({
      next: list => { this.subcategories = list || []; },
      error: err => { console.error('Error precargando subcategorías:', err); this.subcategories = []; }
    });
    this.subs.push(prec);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
  
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  goToLogin(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/auth']); 
  }

  async onSignOut(): Promise<void> {
    try {
      this.isUserMenuOpen = false;
      await this.authService.signOut();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  setCartVisible(visible: boolean): void { this.isCartVisible = visible; }
  
  selectCategory(name: string): void {
    this.categoryService.setCategory(name);
    this.selectedCategoryName = name;
    const map: { [k: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
    const id = map[name];
    if (id) this.productService.setCategory(id);
    else this.productService.setCategory(undefined);
    this.hoveredCategoryName = null;
    this.hoveredBrands = [];
    this.loadingBrands = false;
  }
  
  onHoverCategory(name: string | null): void {
    this.hoveredCategoryName = name;
    if (!name) { this.hoveredBrands = []; this.loadingBrands = false; return; }
    const map: { [k: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
    const idCategoria = map[name];
    if (!idCategoria) { this.hoveredBrands = []; this.loadingBrands = false; return; }
    if (this.subcategories && this.subcategories.length > 0) {
      this.hoveredBrands = this.subcategories.filter(s => s.idCategoria === idCategoria);
      this.loadingBrands = false;
      return;
    }
    this.loadingBrands = true;
    const s = this.subcategoryService.getSubcategories().subscribe({
      next: list => {
        this.subcategories = list || [];
        this.hoveredBrands = this.subcategories.filter(sc => sc.idCategoria === idCategoria);
        this.loadingBrands = false;
      },
      error: err => {
        console.error('Error cargando subcategorías al hacer hover:', err);
        this.subcategories = []; this.hoveredBrands = []; this.loadingBrands = false;
      }
    });
    this.subs.push(s);
  }

  // --- INICIO DE LA CORRECCIÓN DEFINITIVA CONTRA RACE CONDITION ---
  selectBrandByName(name: string): void {
    this.selectedBrandName = name;

    // Función interna que aplica el filtro una vez se asegura de tener las subcategorías.
    const applyFilter = (subcategories: Subcategory[]) => {
      const brandSubCategoryIds = subcategories
        .filter(s => s.nombre && s.nombre.toLowerCase() === name.toLowerCase())
        .map(s => s.idSubCategoria);
      
      // Llama al servicio con la lista de IDs o con null si no se encontró nada.
      this.productService.setSubCate(brandSubCategoryIds.length > 0 ? brandSubCategoryIds : null);
    };

    // Si las subcategorías ya están cargadas en memoria, se usan directamente.
    if (this.subcategories && this.subcategories.length > 0) {
      applyFilter(this.subcategories);
    } else {
      // Si no están cargadas (race condition), se obtienen primero y LUEGO se aplica el filtro.
      const sub = this.subcategoryService.getSubcategories().subscribe({
        next: list => {
          this.subcategories = list || []; // Se guardan para futuras ocasiones.
          applyFilter(this.subcategories);
        },
        error: err => console.error('Error al obtener subcategorías para el filtro de marca:', err)
      });
      this.subs.push(sub); // Se añade la suscripción al gestor para limpiarla al destruir el componente.
    }
  }
  // --- FIN DE LA CORRECCIÓN DEFINITIVA ---

  onSearch(): void {
    const q = (this.searchTerm || '').trim();
    if (q) {
      const cur = this.productService.getCurrentFilters();
      this.productService.loadProducts({...cur, q});
    } else {
      this.productService.loadProducts();
    }
  }
}
