// home.component.ts (SIN LÓGICA DE MARCAS)
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ProductService, FilterParams } from '../../services/product.service';
import { SubcategoryService } from '../../services/subcategory.service';
import { FavoritesService } from '../../services/favorites.service';
import { ProductoTienda } from '../../models/producto-tienda.model';
import { Subcategory } from '../../models/subcategory';
import { CategoryService } from '../../services/category.service';

const CATEGORY_ID_MAP: { [key: string]: number } = {
  'Hombres': 1,
  'Mujeres': 2,
  'Infantil': 3
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  // --- Lógica de Paginación: Propiedades ---
  products: ProductoTienda[] = [];
  paginatedProducts: ProductoTienda[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 27;
  totalPages: number = 0;
  // --- Fin Paginación ---

  isLoading = true;
  favoriteProductIds: number[] = [];

  promoBanners: { asset: string; title?: string; link?: string }[] = [
    { asset: 'assets/images/Banner-hombre2.png', link: '' },
    { asset: 'assets/images/banner2.png', link: '' }
  ];

  carouselIndex = 0;
  private carouselInterval: any;

  activeFilters: FilterParams = {};
  selectedCategoryName = 'Todos';

  openFilterSections = new Set<string>();
  priceRange: { min: number, max: number } = { min: 0, max: 500 };

  filterOptions = {
    articulos: ['Botas', 'Zapatillas', 'Sandalias', 'Zapatos'],
    estilos: ['Casual', 'Urbano', 'Deportivo', 'Fiesta'],
    colores: ['Negro', 'Blanco', 'Gris', 'Marrón', 'Multicolor'],
    tallas: [] as string[]
  };

  private subs: Subscription[] = [];

  constructor(
    public productService: ProductService,
    private subcategoryService: SubcategoryService,
    private categoryService: CategoryService,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {
    for (let s = 30; s <= 45; s++) {
      this.filterOptions.tallas.push(String(s));
    }
  }

  ngOnInit(): void {
    this.isLoading = true;

    this.subs.push(
      this.productService.filters$.subscribe((f) => {
        this.activeFilters = f || {};
        if (f && f.cat) {
          const id = f.cat as number;
          const name = Object.keys(CATEGORY_ID_MAP).find(k => CATEGORY_ID_MAP[k] === id);
          this.selectedCategoryName = name || 'Todos';
        } else {
          this.selectedCategoryName = 'Todos';
        }
      })
    );

    this.subs.push(
      this.productService.products$.subscribe(prods => {
        this.products = prods || [];
        this.isLoading = false;
        this.currentPage = 1;
        this.updatePaginatedProducts();
      })
    );

    this.subs.push(
      this.favoritesService.favoritos$.subscribe((favoritos: ProductoTienda[]) => {
        this.favoriteProductIds = favoritos.map(fav => fav.idProducto);
      })
    );

    this.loadInitialData();

    this.subs.push(
      this.categoryService.selectedCategory$.subscribe((name: string | null) => {
        if (name) {
          const id = name === 'Todos' ? undefined : CATEGORY_ID_MAP[name];
          this.productService.setCategory(id);
        }
      })
    );

    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.stopCarousel();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.productService.loadProducts();
  }

  selectFilterOption(key: 'articulos' | 'estilos' | 'colores' | 'tallas', value: string): void {
    const mapKey: { [k: string]: keyof FilterParams } = {
        articulos: 'articulo', estilos: 'estilo', colores: 'color', tallas: 'tallaU'
    };
    const backendKey = mapKey[key];

    const currentValues = (this.activeFilters[backendKey] as string[]) || [];
    const valueIndex = currentValues.indexOf(value);

    if (valueIndex >= 0) {
        currentValues.splice(valueIndex, 1);
    } else {
        currentValues.push(value);
    }
    this.productService.setArray(backendKey as any, currentValues.length > 0 ? currentValues : undefined);
  }

  isFilterActive(key: 'articulos' | 'estilos' | 'colores' | 'tallas', value: string): boolean {
    const mapKey: { [k: string]: keyof FilterParams } = {
        articulos: 'articulo', estilos: 'estilo', colores: 'color', tallas: 'tallaU'
    };
    const backendKey = mapKey[key];
    const activeFilterValue = this.activeFilters[backendKey];

    if (!Array.isArray(activeFilterValue) || activeFilterValue.length === 0) {
        return false;
    }

    return (activeFilterValue as string[]).includes(value);
  }
  
  updatePaginatedProducts(): void {
    if (!this.products) {
      this.paginatedProducts = [];
      this.totalPages = 0;
      return;
    }
    
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
    
    this.cdr.detectChanges();
  }

  goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return;
    }
    this.currentPage = pageNumber;
    this.updatePaginatedProducts();
    document.querySelector('.main-content')?.scrollIntoView({ behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  calculateOriginalPrice(salePrice: number): number {
    const discountPercentage = 0.28;
    return salePrice / (1 - discountPercentage);
  }

  isFavorite(productId: number): boolean {
    return this.favoriteProductIds.includes(productId);
  }

  toggleFavorite(product: ProductoTienda, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const productId = product.idProducto;
    if (this.isFavorite(productId)) {
      this.favoritesService.quitarFavorito(productId);
    } else {
      this.favoritesService.agregarFavorito(product);
    }
  }

  performSearch(term: string): void {
    const q = (term || '').trim();
    if (!q) {
      this.productService.loadProducts();
      return;
    }
    const cur = this.productService.getCurrentFilters();
    this.productService.loadProducts({ ...cur, q });
  }

  toggleFilterSection(section: string): void {
    if (this.openFilterSections.has(section)) {
      this.openFilterSections.delete(section);
    } else {
      this.openFilterSections.add(section);
    }
  }

  onSideFilterChange(): void {
    this.productService.setPriceRange(this.priceRange.min, this.priceRange.max);
  }

  resetSideFilters(): void {
    this.productService.clearAllFilters();
    this.priceRange = { min: 0, max: 500 };
    this.openFilterSections.clear();
  }

  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextBanner();
    }, 5000);
  }

  stopCarousel(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }

  nextBanner(): void {
    if (!this.promoBanners || this.promoBanners.length === 0) return;
    this.carouselIndex = (this.carouselIndex + 1) % this.promoBanners.length;
  }

  prevBanner(): void {
    if (!this.promoBanners || this.promoBanners.length === 0) return;
    this.carouselIndex = (this.carouselIndex - 1 + this.promoBanners.length) % this.promoBanners.length;
  }

  selectBanner(i: number): void {
    if (i >= 0 && i < this.promoBanners.length) {
      this.stopCarousel();
      this.carouselIndex = i;
      this.startCarousel();
    }
  }
}
