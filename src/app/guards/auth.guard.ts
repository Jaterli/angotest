import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  console.log('Acceso no permitido.');
  // opcional: guardar url para redirigir después del login
  router.navigate(['/login#user'], { queryParams: { returnUrl: state?.url }});
  return false;
};
