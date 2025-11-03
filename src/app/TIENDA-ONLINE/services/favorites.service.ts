
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthTiendaService } from './auth-tienda.service';
import { ProductoTienda } from '../models/producto-tienda.model';

// Usamos ProductoTienda directamente en lugar de un modelo intermedio
// ya que no tenemos un backend que nos devuelva una estructura diferente.

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoritosSubject = new BehaviorSubject<ProductoTienda[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();
  private idUsuario: number | null = null;
  private storageKey = '';

  constructor(private authService: AuthTiendaService) {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.idUsuario) {
        this.idUsuario = user.idUsuario;
        this.storageKey = `favoritos_${this.idUsuario}`;
        this.loadFavoritosFromStorage();
      } else {
        this.idUsuario = null;
        this.storageKey = '';
        this.favoritosSubject.next([]); // Limpiar favoritos al cerrar sesión
      }
    });
  }

  private loadFavoritosFromStorage() {
    if (!this.idUsuario) {
      this.favoritosSubject.next([]);
      return;
    }
    const favoritosGuardados = localStorage.getItem(this.storageKey);
    const favoritos = favoritosGuardados ? JSON.parse(favoritosGuardados) : [];
    this.favoritosSubject.next(favoritos);
  }

  private saveFavoritosToStorage(favoritos: ProductoTienda[]) {
    if (!this.idUsuario) return;
    localStorage.setItem(this.storageKey, JSON.stringify(favoritos));
    this.favoritosSubject.next(favoritos);
  }

  getFavoritos(): Observable<ProductoTienda[]> {
    return this.favoritos$;
  }

  // Se necesita el producto completo para guardarlo en localStorage
  agregarFavorito(producto: ProductoTienda): void {
    if (!this.idUsuario) {
      console.error('Usuario no logueado. No se puede añadir a favoritos.');
      // Opcional: podrías redirigir al login o mostrar una notificación
      return;
    }

    const favoritosActuales = this.favoritosSubject.getValue();
    if (!favoritosActuales.some(p => p.idProducto === producto.idProducto)) {
      const nuevosFavoritos = [...favoritosActuales, producto];
      this.saveFavoritosToStorage(nuevosFavoritos);
    }
  }

  quitarFavorito(idProducto: number): void {
    if (!this.idUsuario) {
      return;
    }

    const favoritosActuales = this.favoritosSubject.getValue();
    const nuevosFavoritos = favoritosActuales.filter(p => p.idProducto !== idProducto);
    this.saveFavoritosToStorage(nuevosFavoritos);
  }

  esFavorito(idProducto: number): boolean {
    return this.favoritosSubject.getValue().some(p => p.idProducto === idProducto);
  }
}
