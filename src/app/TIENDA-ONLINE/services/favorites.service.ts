
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { AuthTiendaService } from './auth-tienda.service';
import { ProductoFavorito } from '../models/favorito.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = 'http://localhost:3000/api/tienda/favoritos';
  private favoritosSubject = new BehaviorSubject<ProductoFavorito[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();
  private idUsuario: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthTiendaService
  ) {
    this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user && user.idUsuario) {
          this.idUsuario = user.idUsuario;
          return this.http.get<ProductoFavorito[]>(`${this.apiUrl}/usuario/${this.idUsuario}`);
        } else {
          this.idUsuario = null;
          return of([]);
        }
      }),
      catchError(() => of([])) // Manejo de errores, devuelve un array vacío
    ).subscribe((favoritos: ProductoFavorito[]) => {
      this.favoritosSubject.next(favoritos);
    });
  }

  getFavoritos(): Observable<ProductoFavorito[]> {
    if (!this.idUsuario) {
      return of([]);
    }
    return this.http.get<ProductoFavorito[]>(`${this.apiUrl}/usuario/${this.idUsuario}`).pipe(
      tap(favoritos => this.favoritosSubject.next(favoritos))
    );
  }

  agregarFavorito(idProducto: number): Observable<any> {
    if (!this.idUsuario) {
      return of(null); // O podrías emitir un error
    }
    return this.http.post(this.apiUrl, { idUsuario: this.idUsuario, idProducto }).pipe(
      tap(() => {
        this.getFavoritos().subscribe(); // Recargar la lista de favoritos
      })
    );
  }

  quitarFavorito(idProducto: number): Observable<any> {
    if (!this.idUsuario) {
      return of(null);
    }
    return this.http.delete(`${this.apiUrl}/usuario/${this.idUsuario}/producto/${idProducto}`).pipe(
      tap(() => {
        this.getFavoritos().subscribe(); // Recargar la lista de favoritos
      })
    );
  }

  esFavorito(idProducto: number): boolean {
    return this.favoritosSubject.getValue().some(p => p.idProducto === idProducto);
  }
}
