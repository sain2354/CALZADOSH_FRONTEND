import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthTiendaService } from '../../../services/auth-tienda.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css']
})
export class RegisterPageComponent {

  private authService = inject(AuthTiendaService);
  private cartService = inject(CartService);
  private router = inject(Router);

  isLoading = false;
  errorMessage: string | null = null;
  registrationSuccess = false; // <-- 1. NUEVA PROPIEDAD

  async handleRegister(displayName: string, dni: string, telefono: string, email: string, pass: string): Promise<void> {
    if (!displayName || !dni || !telefono || !email || !pass) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }
    if (pass.length < 6) {
        this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        return;
    }
    if (dni.length !== 8) {
        this.errorMessage = 'El número de DNI debe tener 8 dígitos.';
        return;
    }

    this.startLoading();

    try {
      const backendResponse = await this.authService.signUpWithEmail(email, pass, displayName, dni, telefono);
      this.handleSuccess(backendResponse.idUsuario);

    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleSuccess(idUsuario: number): void {
    console.log(`Registro exitoso. ID de Usuario del Backend: ${idUsuario}`);
    
    this.cartService.asociarUsuarioAlCarrito(idUsuario);

    this.registrationSuccess = true; // <-- 2. MOSTRAMOS EL MENSAJE DE ÉXITO
    this.stopLoading();
  }

  private handleError(error: any): void {
    console.error('Error durante el registro:', error);

    if (error.code === 'auth/email-already-in-use') {
      this.errorMessage = 'El correo electrónico ya está registrado.';
    } else if (error.code === 'auth/invalid-email') {
      this.errorMessage = 'El formato del correo electrónico no es válido.';
    } else if (error.code === 'auth/weak-password') {
      this.errorMessage = 'La contraseña es demasiado débil.';
    } else {
      this.errorMessage = 'Ocurrió un error inesperado al crear tu cuenta.';
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
