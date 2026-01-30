import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Guard simple pour proteger les routes
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Verifie si l'utilisateur est connecte
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    // Redirige vers login
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};
