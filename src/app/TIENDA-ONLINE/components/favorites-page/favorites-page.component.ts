import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { ProductService } from '../../services/product.service';
import { ProductoTienda } from '../../models/producto-tienda.model';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  // =================================================================================
  // SOLUCIÓN NUCLEAR: Se elimina 'templateUrl' y se incrusta el HTML directamente.
  // Esto fuerza al compilador a usar la plantilla correcta.
  // =================================================================================
  template: `
    <!-- favorites-page.component.html - VERSIÓN FINAL Y LIMPIA -->

    <div class="favorites-container">
      <h2>Mis Favoritos</h2>
      <div *ngIf="(favoritos$ | async) as favoritos; else loading">
        <div *ngIf="favoritos.length > 0; else emptyFavorites" class="favorites-grid">
          
          <div *ngFor="let favorito of favoritos" 
               class="product-card" 
               (click)="verDetalles(favorito)" 
               role="button" 
               tabindex="0" 
               [attr.aria-label]="'Ver detalles de ' + favorito.nombre">
            
            <div class="badge-discount">-28%</div>

            <div class="product-image-container">
              <img [src]="productService.getImageUrl(favorito.foto)" alt="{{ favorito.nombre }}" class="product-image">
            </div>

            <div class="product-info">
              <h4 class="product-brand">{{ favorito.subCategoriaDescripcion | uppercase }}</h4>
              <h3 class="product-name">{{ favorito.nombre }}</h3>
              <div class="price-container">
                <span class="original-price">{{ calculateOriginalPrice(favorito.precioVenta) | currency:'S/ ' }}</span>
                <span class="sale-price">{{ favorito.precioVenta | currency:'S/ ' }}</span>
              </div>
            </div>
            
            <div class="product-actions">
              <button class="remove-button" (click)="solicitarConfirmacion($event, favorito)">Quitar</button>
            </div>
          </div>

        </div>
        <ng-template #emptyFavorites>
          <div class="empty-favorites-container">
            <p>Aún no tienes productos favoritos.</p>
            <a routerLink="/tienda/home" class="explore-link">¡Explora nuestros productos!</a>
          </div>
        </ng-template>
      </div>
      <ng-template #loading>
        <p class="loading-indicator">Cargando favoritos...</p>
      </ng-template>
    </div>

    <!-- MODAL DE CONFIRMACIÓN (EL CORRECTO) -->
    <div *ngIf="modalAbierto" class="modal-overlay">
      <div class="modal-dialog">
        <p class="modal-message">{{ mensajeConfirmacion }}</p>
        <div class="modal-actions">
          <button class="modal-button cancel" (click)="cerrarModal()">Cancelar</button>
          <button class="modal-button confirm" (click)="confirmarEliminacion()">Confirmar</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./favorites-page.component.css']
})
export class FavoritesPageComponent implements OnInit {
  favoritos$: Observable<ProductoTienda[]>;
  
  modalAbierto = false;
  productoParaEliminar: ProductoTienda | null = null;
  mensajeConfirmacion = '';

  constructor(
    private favoritesService: FavoritesService,
    public productService: ProductService,
    private router: Router 
  ) {
    this.favoritos$ = this.favoritesService.favoritos$;
  }

  ngOnInit(): void {}

  verDetalles(favorito: ProductoTienda): void {
    this.router.navigate(['/tienda/producto', favorito.idProducto]);
  }

  solicitarConfirmacion(event: MouseEvent, favorito: ProductoTienda): void {
    event.stopPropagation(); 
    
    this.productoParaEliminar = favorito;
    // Se restaura el mensaje original
    this.mensajeConfirmacion = `¿Estás seguro de que deseas eliminar "${favorito.nombre}" de tus favoritos?`;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.productoParaEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.productoParaEliminar) {
      this.favoritesService.quitarFavorito(this.productoParaEliminar.idProducto);
    }
    this.cerrarModal();
  }

  calculateOriginalPrice(salePrice: number): number {
    const discountPercentage = 0.28;
    return salePrice / (1 - discountPercentage);
  }
}
