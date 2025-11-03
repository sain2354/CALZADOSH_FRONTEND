// home.component.ts (con la función para calcular el precio original)
import { Component, OnInit, OnDestroy } from '@angular/core';
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

  products: ProductoTienda[] = [];
  allSubcategories: Subcategory[] = [];
  filteredSubcategories: Subcategory[] = [];
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
  selectedBrandId: number | undefined;
  searchTerm = '';

  isFilterPanelOpen = false;
  priceRange: { min: number, max: number } = { min: 0, max: 500 };

  readonly filterOptions = {
    generos: ['Masculino', 'Femenino', 'Unisex'],
    articulos: ['Botas', 'Zapatillas', 'Sandalias', 'Zapatos'],
    estilos: ['Casual', 'Urbano', 'Deportivo', 'Fiesta'],
    colores: ['Negro', 'Blanco', 'Gris', 'Marrón', 'Multicolor'],
    tallas: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
  };

  private subs: Subscription[] = [];

  constructor(
    public productService: ProductService,
    private subcategoryService: SubcategoryService,
    private categoryService: CategoryService,
    private favoritesService: FavoritesService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    this.subs.push(
      this.productService.products$.subscribe(prods => {
        this.products = prods || [];
        this.isLoading = false;
      })
    );

    this.subs.push(
      this.productService.filters$.subscribe((f) => {
        this.activeFilters = f || {};
        if (f && f.cat) {
          const id = f.cat as number;
          const name = Object.keys(CATEGORY_ID_MAP).find(k => CATEGORY_ID_MAP[k] === id);
          if (name) this.selectedCategoryName = name;
        } else {
          this.selectedCategoryName = 'Todos';
        }
      })
    );

    this.subs.push(
      this.favoritesService.favoritos$.subscribe((favoritos: ProductoTienda[]) => {
        this.favoriteProductIds = favoritos.map(fav => fav.idProducto);
      })
    );

    this.loadInitialData();

    this.subs.push(
      this.categoryService.selectedCategory$.subscribe(name => {
        if (name) {
          const map: { [k: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
          const id = map[name];
          this.productService.setCategory(id || undefined);
        }
      })
    );

    this.subs.push(
      this.categoryService.selectedBrand$.subscribe(brandId => {
        this.productService.setSubCate(brandId || undefined);
      })
    );

    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.stopCarousel();
  }
  
  calculateOriginalPrice(salePrice: number): number {
    const discountPercentage = 0.28;
    const originalPrice = salePrice / (1 - discountPercentage);
    return originalPrice;
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

  loadInitialData(): void {
    this.isLoading = true;
    this.subs.push(
      this.subcategoryService.getSubcategories().subscribe({
        next: (subcategories) => {
          this.allSubcategories = subcategories || [];
          this.filterBrandsForCategory();
          this.productService.loadProducts();
        },
        error: err => {
          console.error('Error al precargar subcategorías:', err);
          this.productService.loadProducts();
        }
      })
    );
  }

  applyFiltersAndReload(): void {
    this.isLoading = true;
    this.productService.loadProducts();
  }

  private applyCategoryFromService(categoryName: string): void {
    this.selectedCategoryName = categoryName;
    this.selectedBrandId = undefined;
    this.productService.setCategory(categoryName === 'Todos' ? undefined : CATEGORY_ID_MAP[categoryName]);
    this.productService.setSubCate(undefined);
    this.filterBrandsForCategory();
  }

  selectCategory(categoryName: string): void {
    this.categoryService.setCategory(categoryName);
  }

  selectBrand(brandId: number): void {
    this.selectedBrandId = brandId;
    this.productService.setSubCate(brandId);
  }

  private filterBrandsForCategory(): void {
    if (this.selectedCategoryName === 'Todos') {
      this.filteredSubcategories = [];
    } else {
      const categoryId = CATEGORY_ID_MAP[this.selectedCategoryName];
      this.filteredSubcategories = this.allSubcategories.filter(sub => sub.idCategoria === categoryId);
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

  toggleFilterPanel(open?: boolean): void {
    this.isFilterPanelOpen = open !== undefined ? open : !this.isFilterPanelOpen;
  }

  onSideFilterChange(): void {
    this.productService.setPriceRange(this.priceRange.min, this.priceRange.max);
  }

  resetSideFilters(): void {
    this.productService.clearAllFilters();
    this.priceRange = { min: 0, max: 500 };
    this.toggleFilterPanel(false);
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
