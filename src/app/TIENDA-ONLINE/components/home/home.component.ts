// home.component.ts (VERSIÓN FINAL CON LÓGICA DE FILTRADO FUNCIONAL)
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

  openFilterSections = new Set<string>();
  priceRange: { min: number, max: number } = { min: 0, max: 500 };

  filterOptions = {
    articulos: ['Botas', 'Zapatillas', 'Sandalias', 'Zapatos'],
    estilos: ['Casual', 'Urbano', 'Deportivo', 'Fiesta'],
    colores: ['Negro', 'Blanco', 'Gris', 'Marrón', 'Multicolor'],
    tallas: [] as string[],
    marcas: [] as string[]
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
      this.categoryService.selectedCategory$.subscribe((name: string | null) => {
        if (name) {
          const map: { [k: string]: number } = { 'Hombres': 1, 'Mujeres': 2, 'Infantil': 3 };
          const id = map[name];
          this.productService.setCategory(id || undefined);
        }
      })
    );

    this.subs.push(
      this.categoryService.selectedBrand$.subscribe((brandId: number | null) => {
        if (!brandId) {
          this.productService.setSubCate(undefined);
          return;
        }

        if (this.allSubcategories.length > 0) {
          const selectedSubcategory = this.allSubcategories.find(sub => sub.idSubCategoria === brandId);
          
          if (selectedSubcategory) {
            const brandName = selectedSubcategory.nombre;
            
            const brandIds = this.allSubcategories
              .filter(sub => sub.nombre === brandName)
              .map(sub => sub.idSubCategoria);

            this.productService.setSubCate(brandIds.length > 0 ? brandIds : undefined);
          } else {
            this.productService.setSubCate(brandId);
          }
        } else {
          this.productService.setSubCate(brandId);
        }
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
          this.allSubcategories = subcategories;
          
          const uniqueMarcas = [...new Set(this.allSubcategories.map(s => s.nombre))].filter(Boolean);
          this.filterOptions.marcas = uniqueMarcas;

          this.cdr.detectChanges();
          this.filterBrandsForCategory();
          this.productService.loadProducts();
        },
        error: err => {
          console.error('[HomeComponent] Error al precargar subcategorías:', err);
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

    if (!brandId) {
      this.productService.setSubCate(undefined);
      return;
    }

    if (this.allSubcategories.length > 0) {
      const selectedSub = this.allSubcategories.find(s => s.idSubCategoria === brandId);
      if (selectedSub) {
        const brandName = selectedSub.nombre;
        const allIdsForBrand = this.allSubcategories
          .filter(s => s.nombre === brandName)
          .map(s => s.idSubCategoria);
        
        this.productService.setSubCate(allIdsForBrand);
      } else {
        this.productService.setSubCate(brandId);
      }
    } else {
      this.productService.setSubCate(brandId);
    }
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

  selectFilterOption(key: 'articulos' | 'estilos' | 'colores' | 'tallas' | 'marcas', value: string) {
    const mapKey: { [k: string]: keyof FilterParams } = {
      articulos: 'articulo', estilos: 'estilo', colores: 'color', tallas: 'tallaU', marcas: 'subCate'
    };
    const backendKey = mapKey[key];
    const isActive = this.isFilterActive(key, value);

    if (isActive) {
      // Si la marca ya está activa, la deseleccionamos.
      this.productService.setSubCate(undefined);
    } else {
      // Si se selecciona una nueva marca, la establecemos como el filtro.
      if (key === 'marcas') {
        const brandIds = this.allSubcategories
          .filter(s => s.nombre === value)
          .map(s => s.idSubCategoria);
        this.productService.setSubCate(brandIds.length > 0 ? brandIds : undefined);
      } else {
        // (Lógica para otros filtros que podrían ser multiselect)
        this.productService.setArray(backendKey as 'articulo' | 'estilo' | 'color' | 'tallaU', [value]);
      }
    }
  }

  isFilterActive(key: 'articulos' | 'estilos' | 'colores' | 'tallas' | 'marcas', value: string): boolean {
    const mapKey: { [k: string]: keyof FilterParams } = {
      articulos: 'articulo', estilos: 'estilo', colores: 'color', tallas: 'tallaU', marcas: 'subCate'
    };
    const backendKey = mapKey[key];
    const activeValue = this.activeFilters[backendKey];

    if (key === 'marcas') {
      if (!Array.isArray(activeValue) || activeValue.length === 0) {
        return false;
      }
      const brandIds = this.allSubcategories
        .filter(s => s.nombre === value)
        .map(s => s.idSubCategoria);
      
      const activeSet = new Set(activeValue as number[]);
      // Comprueba si los IDs de la marca seleccionada coinciden exactamente con los IDs activos.
      return brandIds.length > 0 && brandIds.every(id => activeSet.has(id)) && brandIds.length === activeSet.size;
    }

    if (!Array.isArray(activeValue)) {
      return false;
    }

    return (activeValue as string[]).includes(value);
  }
}
