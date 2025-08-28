// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { LoginResponse } from '../../models/login-response.model'; // Import LoginResponse model

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  showPassword: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.errorMessage = null;

    const credentials = {
      usernameOrEmail: this.username,
      password: this.password
    };

    this.usuarioService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);

        if (response && response.usuario) {
          const userLoginInfo = response.usuario;

          // === CORRECCIÓN ===
          // Aseguramos que nombreRol sea un string (proporcionando un valor por defecto si es undefined)
          const userRole = userLoginInfo.nombreRol || ''; // Use '' if nombreRol is undefined
          // === FIN CORRECCIÓN ===

          // Call authService.loginSuccess with username and the guaranteed string role
          this.authService.loginSuccess(userLoginInfo.username, userRole); // Pass the 'userRole' variable

          this.router.navigate(['/dashboard']);

        } else {
          this.errorMessage = 'Inicio de sesión exitoso, pero la información del usuario no está disponible.';
          console.error('Login successful, but user information is missing in the backend response.');
           this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = error.message || 'Error en el inicio de sesión. Inténtalo de nuevo.';
      }
    });
  }
}
