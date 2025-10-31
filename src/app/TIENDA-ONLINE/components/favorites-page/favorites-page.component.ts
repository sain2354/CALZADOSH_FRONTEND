import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { FavoritesService } from '../../services/favorites.service';
import { ProductoFavorito } from '../../models/favorito.model';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites-page.component.html',
  styleUrls: ['./favorites-page.component.css']
})
export class FavoritesPageComponent implements OnInit {
  favoritos$: Observable<ProductoFavorito[]>;

  constructor(private favoritesService: FavoritesService) {
    this.favoritos$ = this.favoritesService.favoritos$;
  }

  ngOnInit(): void {
    this.favoritesService.getFavoritos().subscribe();
  }

  quitarFavorito(idProducto: number): void {
    this.favoritesService.quitarFavorito(idProducto).subscribe();
  }
}
