// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service'; // Import AuthService

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
          const userRole = userLoginInfo.nombreRol || ''; // Ensure userRole is a string

          // Store session information
          this.authService.loginSuccess(userLoginInfo.username, userRole);

          // --- REDIRECCIÓN INTELIGENTE (CORREGIDA) ---
          // Comprueba el rol del usuario para decidir a dónde redirigir.
          if (userRole.toLowerCase() === 'administrador') { // CORREGIDO: de 'admin' a 'administrador'
            // Si es administrador, va al panel de administración.
            this.router.navigate(['/admin/dashboard']);
          } else {
            // Si es cualquier otro rol (cliente, etc.), va a la página principal de la tienda.
            this.router.navigate(['/']); // Redirige a la raíz
          }
          // --- FIN DE LA REDIRECCIÓN ---

        } else {
          this.errorMessage = 'Inicio de sesión exitoso, pero la información del usuario no está disponible.';
          console.error('Login successful, but user information is missing in the backend response.');
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = error.message || 'Error en el inicio de sesión. Inténtalo de nuevo.';
      }
    });
  }
}
