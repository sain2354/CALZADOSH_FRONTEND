// layout-tienda.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { SubcategoryService } from '../../services/subcategory.service';
import { Subcategory } from '../../models/subcategory';
import { ProductService } from '../../services/product.service';

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

  // búsqueda visual en header
  searchTerm = '';

  // filtros solicitados (exactamente como pediste)
  filterOptions = {
    generos: ['Masculino', 'Femenino', 'Unisex'],
    articulos: ['Botas', 'Zapatillas', 'Sandalias', 'Zapatos'],
    estilos: ['Casual', 'Urbano', 'Deportivo', 'Fiesta'],
    colores: ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo'],
    tallas: [] as string[]
  };

  // Marcas (botón "Marcas" al lado de las categorías)
  marcasList: string[] = ['Nike', 'Adidas', 'Puma', 'I-Run'];
  selectedBrandName: string | null = null;

  // para reflejar selección visual
  activeFilters: any = {};

  private subs: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
    private productService: ProductService,
    private router: Router
  ) {
    this.cartItemCount$ = this.cartService.getCartItemCount();

    // generar tallas desde 30 a 45
    for (let s = 30; s <= 45; s++) {
      this.filterOptions.tallas.push(String(s));
    }
  }

  ngOnInit(): void {
    // escucha cambios de filtros para marcar chips activos
    this.subs.push(
      this.productService.filters$.subscribe(f => {
        this.activeFilters = f || {};
      })
    );

    // escucha cambios de categoría global para reflejar selección visual (por si se cambia fuera)
    this.subs.push(
      this.categoryService.selectedCategory$.subscribe(name => {
        if (name) this.selectedCategoryName = name;
      })
    );

    // precargar subcategorías para mapear marcas a id (si disponible)
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
    this.selectedCategoryName = name;
    const map: { [k: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
    const id = map[name];
    if (id) this.productService.setCategory(id);
    else this.productService.setCategory(undefined);
    // cerrar dropdown visual
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
        this.subcategories = [];
        this.hoveredBrands = [];
        this.loadingBrands = false;
      }
    });
    this.subs.push(s);
  }

  // Al hacer click en una marca pequeña (dropdown "Marcas"), tratamos de mapear a idSubCategoria; si lo encontramos lo aplicamos; si no, navegamos con query param brand
  selectBrandByName(name: string): void {
    this.selectedBrandName = name;
    const found = this.subcategories.find(s => {
      const candidates = [s.nombre, (s as any).Nombre, (s as any).marca, (s as any).descripcion, (s as any).name];
      return candidates.some(c => typeof c === 'string' && c.toLowerCase().includes(name.toLowerCase()));
    });

    if (found) {
      this.productService.setSubCate(found.idSubCategoria);
      // además notificar CategoryService por compatibilidad
      this.categoryService.setBrand(found.idSubCategoria);
    } else {
      // si no hay id, navegamos con query param brand
      this.router.navigate(['/'], { queryParams: { brand: name } });
    }
  }

  // Toggle un chip (ej: genero, articulo, estilo, color, tallaU)
  toggleChip(key: 'generos'|'articulos'|'estilos'|'colores'|'tallas', value: string) {
    const mapKey: { [k: string]: keyof import('../../services/product.service').FilterParams } = {
      generos: 'genero',
      articulos: 'articulo',
      estilos: 'estilo',
      colores: 'color',
      tallas: 'tallaU'
    };
    const backendKey = mapKey[key];
    this.productService.toggleArrayItem(backendKey, value);
  }

  isChipActive(key: 'generos'|'articulos'|'estilos'|'colores'|'tallas', value: string): boolean {
    const mapKey: { [k: string]: keyof import('../../services/product.service').FilterParams } = {
      generos: 'genero',
      articulos: 'articulo',
      estilos: 'estilo',
      colores: 'color',
      tallas: 'tallaU'
    };
    const backendKey = mapKey[key];
    const arr = this.activeFilters[backendKey] as string[] | undefined;
    return Array.isArray(arr) && arr.indexOf(value) >= 0;
  }

  // search header: navegamos por q
  onSearch(): void {
    const q = (this.searchTerm || '').trim();
    if (q) {
      // añadimos 'q' temporalmente y cargamos (sin alterar permanentemente otros filtros)
      const cur = this.productService.getCurrentFilters();
      this.productService.loadProducts({...cur, q});
    } else {
      // vacio: recargar con filtros actuales
      this.productService.loadProducts();
    }
  }
}
