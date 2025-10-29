
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

  // --- Propiedades existentes ---
  cartItemCount$: Observable<number>;
  selectedCategoryName = 'Todos';
  subcategories: Subcategory[] = [];
  hoveredBrands: Subcategory[] = [];
  hoveredCategoryName: string | null = null;
  loadingBrands = false;
  searchTerm = '';
  filterOptions = {
    generos: ['Masculino', 'Femenino', 'Unisex'],
    articulos: ['Botas', 'Zapatillas', 'Sandalias', 'Zapatos'],
    estilos: ['Casual', 'Urbano', 'Deportivo', 'Fiesta'],
    colores: ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo'],
    tallas: [] as string[]
  };
  marcasList: string[] = ['Nike', 'Adidas', 'Puma', 'I-Run'];
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

    for (let s = 30; s <= 45; s++) {
      this.filterOptions.tallas.push(String(s));
    }
  }

  ngOnInit(): void {
    this.subs.push(this.productService.filters$.subscribe(f => { this.activeFilters = f || {}; }));
    this.subs.push(this.categoryService.selectedCategory$.subscribe(name => { if (name) this.selectedCategoryName = name; }));
    const prec = this.subcategoryService.getSubcategories().subscribe({
      next: list => { this.subcategories = list || []; },
      error: err => { console.error('Error precargando subcategorías:', err); this.subcategories = []; }
    });
    this.subs.push(prec);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
  
  // --- INICIO DE MODIFICACIÓN PRECISA Y FINAL ---
  
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  goToLogin(): void {
    this.isUserMenuOpen = false;
    // CORRECCIÓN FINAL: Se usa la ruta '/auth' según la configuración de tienda-online.routes.ts
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
  
  // --- FIN DE MODIFICACIÓN ---

  // --- MÉTODOS EXISTENTES (NO SE MODIFICAN) ---
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
  selectBrandByName(name: string): void {
    this.selectedBrandName = name;
    const found = this.subcategories.find(s => {
      const candidates = [s.nombre, (s as any).Nombre, (s as any).marca, (s as any).descripcion, (s as any).name];
      return candidates.some(c => typeof c === 'string' && c.toLowerCase().includes(name.toLowerCase()));
    });
    if (found) {
      this.productService.setSubCate(found.idSubCategoria);
      this.categoryService.setBrand(found.idSubCategoria);
    } else {
      this.router.navigate(['/'], { queryParams: { brand: name } });
    }
  }
  toggleChip(key: 'generos'|'articulos'|'estilos'|'colores'|'tallas', value: string) {
    const mapKey: { [k: string]: keyof import('../../services/product.service').FilterParams } = {
      generos: 'genero', articulos: 'articulo', estilos: 'estilo', colores: 'color', tallas: 'tallaU'
    };
    const backendKey = mapKey[key];
    this.productService.toggleArrayItem(backendKey, value);
  }
  isChipActive(key: 'generos'|'articulos'|'estilos'|'colores'|'tallas', value: string): boolean {
    const mapKey: { [k: string]: keyof import('../../services/product.service').FilterParams } = {
      generos: 'genero', articulos: 'articulo', estilos: 'estilo', colores: 'color', tallas: 'tallaU'
    };
    const backendKey = mapKey[key];
    const arr = this.activeFilters[backendKey] as string[] | undefined;
    return Array.isArray(arr) && arr.indexOf(value) >= 0;
  }
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
