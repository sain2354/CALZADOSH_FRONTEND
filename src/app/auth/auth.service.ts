import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    // Verificar autenticación al iniciar
    this.checkAuthStatus();
  }

  // Login simulado
  login(username: string, password: string): Observable<any> {
    // Credenciales válidas simuladas
    if (username === 'admin' && password === 'admin123') {
      return of({ token: 'simulated-token' }).pipe(
        tap(response => {
          localStorage.setItem('auth_token', response.token);
          this.isAuthenticatedSubject.next(true);
          this.router.navigate(['/dashboard']); // Redirección después de login exitoso
        })
      );
    }
    // Retorna error para credenciales inválidas
    return throwError(() => new Error('Credenciales incorrectas'));
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('auth_token');
    this.isAuthenticatedSubject.next(!!token);
  }
}