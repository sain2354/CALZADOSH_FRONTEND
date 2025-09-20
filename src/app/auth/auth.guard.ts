// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Importamos el servicio correcto

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Comprobamos si el usuario ha iniciado sesión Y si tiene el rol de 'ADMIN'
  if (authService.isLoggedIn() && authService.hasRole('ADMIN')) {
    // Si es un admin logueado, le damos acceso
    return true;
  }

  // Si no es un admin o no está logueado, lo redirigimos a la página de login
  router.navigate(['/login']);
  // Y bloqueamos el acceso a la ruta protegida
  return false;
};
