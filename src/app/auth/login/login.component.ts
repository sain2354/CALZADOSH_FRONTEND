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
          const userId = userLoginInfo.idUsuario; // Get the user ID

          // Store session information, now including the user ID
          this.authService.loginSuccess(userLoginInfo.username, userRole, userId);

          // --- SMART REDIRECTION (FIXED) ---
          // Check the user's role to decide where to redirect.
          if (userRole.toLowerCase() === 'administrador') { // FIXED: from 'admin' to 'administrador'
            // If administrator, go to the admin dashboard.
            this.router.navigate(['/admin/dashboard']);
          } else {
            // If any other role (client, etc.), go to the main store page.
            this.router.navigate(['/']); // Redirect to the root
          }
          // --- END OF REDIRECTION ---

        } else {
          this.errorMessage = 'Login successful, but user information is not available.';
          console.error('Login successful, but user information is missing in the backend response.');
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = error.message || 'Login error. Please try again.';
      }
    });
  }
}
