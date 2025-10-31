import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

  accordion: { [key: string]: boolean } = {
    caracteristicas: true,
    envio: false
  };

  constructor(
    private route: ActivatedRoute,
    public productService: ProductService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProductData();
  }

  ngOnDestroy(): void {
    if (this.favoritesSub) {
      this.favoritesSub.unsubscribe();
    }
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
        this.product = productData;
        this.setupFavoriteStatusListener();
      } else if (!this.error) {
        this.error = 'No se pudieron cargar los datos del producto.';
      }
    });
  }

  private setupFavoriteStatusListener(): void {
    this.isFavorite = this.favoritesService.esFavorito(this.product!.idProducto);
    this.favoritesSub = this.favoritesService.favoritos$.subscribe(favoritos => {
        this.isFavorite = this.favoritesService.esFavorito(this.product!.idProducto);
    });
  }

  toggleFavorite(): void {
    if (!this.product) return;

    const productId = this.product.idProducto;
    if (this.isFavorite) {
      this.favoritesService.quitarFavorito(productId).subscribe(() => {
        console.log('Producto quitado de favoritos');
      });
    } else {
      this.favoritesService.agregarFavorito(productId).subscribe(() => {
        console.log('Producto agregado a favoritos');
      });
    }
  }
  
  onSizeChange(): void {
    console.log('Talla seleccionada:', this.selectedSize);
  }

  isAddToCartEnabled(): boolean {
    if (!this.product) return false;
    if (this.product.tallas && this.product.tallas.length > 0) {
      return !!this.selectedSize && this.selectedSize.stock > 0;
    }
    return false;
  }

  addToCart(): void {
    if (this.product && this.selectedSize && this.isAddToCartEnabled()) {
      this.cartService.addToCart(this.product, this.selectedSize);
      alert(`${this.product.nombre} (Talla USA ${this.selectedSize.usa}) fue agregado al carrito.`);
    } else {
      alert('Por favor, seleccione una talla con stock disponible.');
    }
  }

  showSizeGuide(): void {
    alert('FUNCIONALIDAD PENDIENTE: Aquí se mostrará la guía de tallas.');
  }

  toggleAccordion(section: 'caracteristicas' | 'envio'): void {
    this.accordion[section] = !this.accordion[section];
  }

  private handleInvalidId(): void {
    this.isLoading = false;
    this.error = 'La URL no contiene un ID de producto válido.';
  }
}
