import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import { CategoryService } from '../services/category.service';
import { SubcategoryService } from '../services/subcategory.service';
import { Subcategory } from '../models/subcategory';

@Component({
  selector: 'app-layout-tienda',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
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

  // se agrega búsqueda visual en header
  searchTerm = '';

  // mostramos mini-filtros en el dropdown (visual solamente)
  filterOptions = {
    generos: ['Masculino', 'Femenino', 'Unisex'],
    articulos: ['Botas', 'Zapatillas', 'Sandalias', 'Zapatos'],
    tallas: ['35', '36', '37', '38', '39', '40', '41', '42'],
    estilos: ['Casual', 'Urbano', 'Deportivo', 'Fiesta'],   // <-- agregado
    colores: ['Negro', 'Blanco', 'Gris', 'Marrón', 'Multicolor'] // <-- agregado
  };

  private subs: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
    private router: Router
  ) {
    this.cartItemCount$ = this.cartService.getCartItemCount();
  }

  ngOnInit(): void {
    this.subs.push(
      this.categoryService.selectedCategory$.subscribe(name => {
        this.selectedCategoryName = name;
      })
    );

    const prec = this.subcategoryService.getSubcategories().subscribe({
      next: list => {
        this.subcategories = list || [];
      },
      error: err => {
        console.error('Error precargando subcategorías en layout:', err);
        this.subcategories = [];
      }
    });
    this.subs.push(prec);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  selectCategory(name: string): void {
    this.categoryService.setCategory(name);
    this.hoveredCategoryName = null;
    this.hoveredBrands = [];
    this.loadingBrands = false;
  }

  onHoverCategory(name: string | null): void {
    this.hoveredCategoryName = name;

    if (!name) {
      this.hoveredBrands = [];
      this.loadingBrands = false;
      return;
    }

    const map: { [k: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
    const idCategoria = map[name];

    if (!idCategoria) {
      this.hoveredBrands = [];
      this.loadingBrands = false;
      return;
    }

    if (this.subcategories && this.subcategories.length > 0) {
      this.hoveredBrands = this.subcategories.filter(s => s.idCategoria === idCategoria);
      console.log('hoveredBrands (filtradas de cache):', this.hoveredBrands);
      this.loadingBrands = false;
      return;
    }

    this.loadingBrands = true;
    const s = this.subcategoryService.getSubcategories().subscribe({
      next: list => {
        this.subcategories = list || [];
        this.hoveredBrands = this.subcategories.filter(sc => sc.idCategoria === idCategoria);
        console.log('hoveredBrands (cargadas desde API):', this.hoveredBrands);
        this.loadingBrands = false;
      },
      error: err => {
        console.error('Error cargando subcategorías al hacer hover:', err);
        this.subcategories = [];
        this.hoveredBrands = [];
        this.loadingBrands = false;
      }
    });
    this.subs.push(s);
  }

  selectBrandFromDropdown(brandId: number): void {
    if (this.hoveredCategoryName) {
      this.categoryService.setCategory(this.hoveredCategoryName);
    }
    this.categoryService.setBrand(brandId);
    this.hoveredCategoryName = null;
    this.hoveredBrands = [];
    this.loadingBrands = false;
  }

  getBrandLabel(b: any, idx?: number): string {
    if (!b) return idx !== undefined ? `Marca ${idx + 1}` : 'Marca';
    const candidates = [
      b.nombre,
      (b as any).Nombre,
      (b as any).descripcion,
      (b as any).marca,
      (b as any).name,
      (b as any).titulo,
      (b as any).label
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim().length > 0) {
        return c.trim();
      }
    }
    return `Marca ${idx !== undefined ? (idx + 1) : ''}`.trim();
  }

  // búsqueda header (visual): navegamos a home con query param q
  onSearch(): void {
    const q = (this.searchTerm || '').trim();
    this.router.navigate(['/'], { queryParams: { q } });
    console.log('Buscar ->', q);
  }
}
