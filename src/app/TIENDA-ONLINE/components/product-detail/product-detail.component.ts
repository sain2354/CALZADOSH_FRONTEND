import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service'; // PASO 1: Importar CartService
import { ProductoTienda, SizeOption } from '../../models/producto-tienda.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product: ProductoTienda | null = null;
  isLoading = true;
  error: string | null = null;
  selectedTalla: SizeOption | null = null;
  showAddedToCartMessage = false; // Para mostrar una notificación

  constructor(
    private route: ActivatedRoute,
    public productService: ProductService,
    private cartService: CartService, // PASO 2: Inyectar CartService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProductData();
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
      } else if (!this.error) {
        this.error = 'No se pudieron cargar los datos del producto.';
      }
    });
  }

  onSizeSelected(tallaUsaValue: string): void {
    const selectedUsa = +tallaUsaValue;
    this.selectedTalla = this.product?.tallas.find(t => t.usa === selectedUsa) || null;
  }
  
  // PASO 3: Método para añadir al carrito
  addToCart(): void {
    if (this.product && this.selectedTalla) {
      this.cartService.addToCart(this.product, this.selectedTalla);
      
      // Muestra un mensaje de confirmación y lo oculta después de 2 segundos
      this.showAddedToCartMessage = true;
      setTimeout(() => {
        this.showAddedToCartMessage = false;
      }, 2000);

    } else {
      // Esto no debería pasar si el botón está bien deshabilitado, pero es una buena práctica.
      console.warn('Intento de añadir al carrito sin producto o talla seleccionada.');
    }
  }

  goBack(): void {
    window.history.back();
  }

  getSizeLabel(talla: SizeOption): string {
    const parts: string[] = [];
    if (talla.usa) parts.push(`USA ${talla.usa}`);
    if (talla.eur) parts.push(`EUR ${talla.eur}`);
    if (talla.cm) parts.push(`CM ${talla.cm}`);
    return parts.join(' / ');
  }

  private handleInvalidId(): void {
    this.isLoading = false;
    this.error = 'La URL no contiene un ID de producto válido.';
  }
}
