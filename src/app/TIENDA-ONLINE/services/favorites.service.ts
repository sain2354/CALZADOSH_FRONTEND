import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly FAVORITES_KEY = 'tienda_favoritos';
  private favoritesSubject = new BehaviorSubject<number[]>(this.getFavoritesFromStorage());
  
  // Observable para que los componentes se suscriban a los cambios
  favorites$ = this.favoritesSubject.asObservable();

  constructor() { }

  private getFavoritesFromStorage(): number[] {
    const favoritesJson = localStorage.getItem(this.FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  }

  private saveFavoritesToStorage(favorites: number[]): void {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    this.favoritesSubject.next(favorites); // Notificar a los suscriptores
  }

  isFavorite(productId: number): boolean {
    return this.getFavoritesFromStorage().includes(productId);
  }

  toggleFavorite(productId: number): void {
    if (this.isFavorite(productId)) {
      this.removeFavorite(productId);
    } else {
      this.addFavorite(productId);
    }
  }

  private addFavorite(productId: number): void {
    const favorites = this.getFavoritesFromStorage();
    if (!favorites.includes(productId)) {
      favorites.push(productId);
      this.saveFavoritesToStorage(favorites);
    }
  }

  private removeFavorite(productId: number): void {
    let favorites = this.getFavoritesFromStorage();
    favorites = favorites.filter(id => id !== productId);
    this.saveFavoritesToStorage(favorites);
  }
}
