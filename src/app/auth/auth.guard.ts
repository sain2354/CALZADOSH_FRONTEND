// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  const userRole = authService.getUserRole() || ''; // Obtenemos el rol del servicio

  // Comprobamos si el usuario ha iniciado sesión Y si su rol es 'administrador'
  if (isLoggedIn && userRole.toLowerCase() === 'administrador') {
    // Si es un administrador logueado, le damos acceso
    return true;
  }

  // Si no cumple las condiciones, lo redirigimos a la página de login del admin
  router.navigate(['/admin/login']);
  // Y bloqueamos el acceso a la ruta protegida
  return false;
};
