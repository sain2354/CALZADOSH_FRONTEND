import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // Se importa ActivatedRoute
import { Observable } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { ProductService } from '../../services/product.service';
import { ProductoTienda } from '../../models/producto-tienda.model';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites-page.component.html',
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
    private router: Router, 
    private route: ActivatedRoute // Se inyecta ActivatedRoute
  ) {
    this.favoritos$ = this.favoritesService.favoritos$;
  }

  ngOnInit(): void {}

  // ==========================================================================================
  // SOLUCIÓN DEFINITIVA: Se corrige la navegación a detalles del producto.
  // Se utiliza navegación relativa (relativeTo) para evitar conflictos con el router.
  // Esto asegura que la app navegue a '../producto/:id' desde la ruta actual ('/favoritos').
  // ==========================================================================================
  verDetalles(favorito: ProductoTienda): void {
    this.router.navigate(['../producto', favorito.idProducto], { relativeTo: this.route });
  }

  solicitarConfirmacion(event: MouseEvent, favorito: ProductoTienda): void {
    event.stopPropagation(); 
    
    this.productoParaEliminar = favorito;
    this.mensajeConfirmacion = `¿Estás seguro de que deseas eliminar \"${favorito.nombre}\" de tus favoritos?`;
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
