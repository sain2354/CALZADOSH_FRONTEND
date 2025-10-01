import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthTiendaService } from '../../services/auth-tienda.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-auth-page',
  standalone: true, // Lo convertimos a standalone para importar módulos directamente
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.css'],
})
export class AuthPageComponent {
  private authService = inject(AuthTiendaService);
  private cartService = inject(CartService);
  private router = inject(Router);

  isLoading = false;
  errorMessage: string | null = null;

  async handleLogin(email: string, pass: string): Promise<void> {
    if (!email || !pass) {
      this.errorMessage = 'Por favor, introduce tu correo y contraseña.';
      return;
    }
    this.startLoading();

    try {
      const backendResponse = await this.authService.signInWithEmail(email, pass);
      this.handleLoginSuccess(backendResponse.idUsuario);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  async handleGoogleLogin(): Promise<void> {
    this.startLoading();
    try {
      const backendResponse = await this.authService.signInWithGoogle();
      this.handleLoginSuccess(backendResponse.idUsuario);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  private handleLoginSuccess(idUsuario: number): void {
    console.log(`Login exitoso. ID de Usuario del Backend: ${idUsuario}`);
    
    // Asociamos el carrito actual (de invitado) con el ID del usuario que acaba de iniciar sesión.
    this.cartService.asociarUsuarioAlCarrito(idUsuario);

    // TODO: Redirigir a la página de envío o checkout.
    // Por ahora, redirigimos a la home de la tienda.
    this.router.navigate(['/']); // Cambiar a '/shipping' o '/checkout' cuando exista
    this.stopLoading();
  }

  private handleLoginError(error: any): void {
    console.error('Error durante el inicio de sesión:', error);
    // Aquí podrías tener un mapeo de errores más amigable
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      this.errorMessage = 'El correo o la contraseña son incorrectos.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      this.errorMessage = 'Has cancelado el inicio de sesión con Google.';
    } else {
      this.errorMessage = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
    this.stopLoading();
  }

  private startLoading(): void {
    this.isLoading = true;
    this.errorMessage = null;
  }

  private stopLoading(): void {
    this.isLoading = false;
  }
}
