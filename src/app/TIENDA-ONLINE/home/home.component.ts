import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { ProductService, FilterParams } from '../services/product.service';
import { SubcategoryService } from '../services/subcategory.service';
import { ProductoTienda } from '../models/producto-tienda.model';
import { Subcategory } from '../models/subcategory';
import { CategoryService } from '../services/category.service';

// Mapeo de nombres de categoría a IDs
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

  // ahora incluimos banner2 (asegúrate que el archivo exista en assets/images/banner2.png)
  promoBanners: { asset: string; title?: string; link?: string }[] = [
    { asset: 'assets/images/Banner-hombre2.png', title: 'Promoción 1', link: '' },
    { asset: 'assets/images/banner2.png', title: 'Promoción 2', link: '' }
  ];

  // carousel index para banner desplazable
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
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();

    // Escuchar cambios de categoría desde layout
    this.subs.push(
      this.categoryService.selectedCategory$.subscribe(name => {
        if (name && name !== this.selectedCategoryName) {
          this.applyCategoryFromService(name);
        }
      })
    );

    // Escuchar cambios de marca desde layout
    this.subs.push(
      this.categoryService.selectedBrand$.subscribe(brandId => {
        if (brandId) {
          this.selectedBrandId = brandId;
          this.activeFilters.subCate = brandId;
          this.applyFiltersAndReload();
        } else {
          this.selectedBrandId = undefined;
          delete this.activeFilters.subCate;
          this.applyFiltersAndReload();
        }
      })
    );

    // Iniciar carousel automático
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.stopCarousel();
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      products: this.productService.fetchProducts(),
      subcategories: this.subcategoryService.getSubcategories()
    }).subscribe({
      next: ({ products, subcategories }) => {
        this.products = products;
        this.allSubcategories = subcategories;
        this.filterBrandsForCategory();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos iniciales:', err);
        this.isLoading = false;
      }
    });
  }

  applyFiltersAndReload(): void {
    this.isLoading = true;
    this.products = [];
    this.productService.fetchProducts(this.activeFilters).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al recargar productos:', err);
        this.isLoading = false;
      }
    });
  }

  private applyCategoryFromService(categoryName: string): void {
    this.selectedCategoryName = categoryName;
    this.selectedBrandId = undefined;

    if (categoryName === 'Todos') {
      delete this.activeFilters.cat;
    } else {
      this.activeFilters.cat = CATEGORY_ID_MAP[categoryName];
    }
    delete this.activeFilters.subCate;

    this.filterBrandsForCategory();
    this.applyFiltersAndReload();
  }

  // Si alguna vista local usa selectCategory
  selectCategory(categoryName: string): void {
    this.categoryService.setCategory(categoryName);
  }

  selectBrand(brandId: number): void {
    this.selectedBrandId = brandId;
    this.activeFilters.subCate = brandId;
    this.applyFiltersAndReload();
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
    console.log('Búsqueda intentada con el término:', term);
    // no modificamos funcionalidad real: dejamos un log (el layout navega con query param)
  }

  toggleFilterPanel(open?: boolean): void {
    this.isFilterPanelOpen = open !== undefined ? open : !this.isFilterPanelOpen;
  }

  onSideFilterChange(): void {
    this.activeFilters.precioMin = this.priceRange.min;
    this.activeFilters.precioMax = this.priceRange.max;
    this.applyFiltersAndReload();
  }

  resetSideFilters(): void {
    this.activeFilters.genero = [];
    this.activeFilters.articulo = [];
    this.activeFilters.estilo = [];
    this.activeFilters.color = [];
    this.activeFilters.tallaU = [];
    this.priceRange = { min: 0, max: 500 };
    delete this.activeFilters.precioMin;
    delete this.activeFilters.precioMax;

    this.onSideFilterChange();
    this.toggleFilterPanel(false);
  }

  /* ---------- Carousel controls para banners ---------- */
  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextBanner();
    }, 5000); // Cambia cada 5 segundos
  }

  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
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
      // Reiniciar el intervalo al seleccionar manualmente
      this.stopCarousel();
      this.carouselIndex = i;
      this.startCarousel();
    }
  }
}