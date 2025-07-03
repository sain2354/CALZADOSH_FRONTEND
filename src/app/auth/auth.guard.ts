// src/app/auth/auth.guard.ts
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  // Por ahora, dejamos que siempre pase (true)
  return true;
};
