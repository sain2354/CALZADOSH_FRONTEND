import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { ProductoTienda, SizeOption } from '../../models/producto-tienda.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product: ProductoTienda | null = null;
  selectedSize: SizeOption | null = null;
  isLoading = true;
  error: string | null = null;
  isFavorite = false;
  private favoritesSub!: Subscription;
  showSuccessMessage = false;

  showSizeGuideModal = false;
  accordion: { [key: string]: boolean } = {
    caracteristicas: true
  };

  constructor(
    private route: ActivatedRoute,
    public productService: ProductService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.loadProductData();
  }

  ngOnDestroy(): void {
    if (this.favoritesSub) {
      this.favoritesSub.unsubscribe();
    }
  }

  goBack(): void {
    this.location.back();
  }

  private loadProductData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || isNaN(+id)) {
      this.handleInvalidId();
      return;
    }

    const numericId = +id;
    this.isLoading = true;
    this.productService.fetchProductById(numericId).pipe(
      catchError(err => {
        this.error = 'El producto no fue encontrado o no está disponible.';
        return of(null);
      })
    ).subscribe(productData => {
      this.isLoading = false;
      if (productData) {
        this.product = this.translateCategory(productData);
        this.setupFavoriteStatusListener();
      } else if (!this.error) {
        this.error = 'No se pudieron cargar los datos del producto.';
      }
    });
  }

  private translateCategory(product: ProductoTienda): ProductoTienda {
    const categoryMap: { [key: number]: string } = {
      1: 'Hombres',
      2: 'Mujeres',
      3: 'Infantil'
    };
    product.categoriaDescripcion = categoryMap[product.idCategoria] || 'No especificada';
    return product;
  }

  private setupFavoriteStatusListener(): void {
    if (!this.product) return;
    this.isFavorite = this.favoritesService.esFavorito(this.product.idProducto);
    this.favoritesSub = this.favoritesService.favoritos$.subscribe(() => {
        if (this.product) {
            this.isFavorite = this.favoritesService.esFavorito(this.product.idProducto);
        }
    });
  }
  
  get originalPrice(): number {
    if (!this.product) return 0;
    return this.product.precioVenta / (1 - 0.28);
  }

  toggleFavorite(): void {
    if (!this.product) {
      console.error('Intento de modificar favoritos sin un producto cargado.');
      return;
    }

    if (this.isFavorite) {
      this.favoritesService.quitarFavorito(this.product.idProducto);
    } else {
      this.favoritesService.agregarFavorito(this.product);
    }
  }
  
  onSizeChange(): void {}

  isAddToCartEnabled(): boolean {
    if (!this.product?.tallas?.length) return false;
    return !!this.selectedSize && this.selectedSize.stock > 0;
  }

  addToCart(): void {
    if (this.product && this.selectedSize && this.isAddToCartEnabled()) {
      this.cartService.addToCart(this.product, this.selectedSize);
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    } else {
      alert('Por favor, seleccione una talla con stock disponible.');
    }
  }

  showSizeGuide(): void {
    this.showSizeGuideModal = true;
  }

  closeSizeGuide(): void {
    this.showSizeGuideModal = false;
  }
  
  getSizeGuideImage(): string {
    const category = this.product?.categoriaDescripcion?.toLowerCase() || '';
    if (category.includes('hombre')) {
      return 'assets/images/GUIAS-TALLAS-HOMBRES.png';
    } else if (category.includes('mujer')) {
      return 'assets/images/GUIAS-TALLAS-MUJERES.png';
    } else if (category.includes('infantil')) {
      return 'assets/images/GUIAS-TALLAS-INFANTIL.png';
    } else {
      return 'assets/images/GUIAS-TALLAS-HOMBRES.png'; // Fallback por defecto
    }
  }

  toggleAccordion(section: string): void {
    this.accordion[section] = !this.accordion[section];
  }

  private handleInvalidId(): void {
    this.isLoading = false;
    this.error = 'La URL no contiene un ID de producto válido.';
  }
}
