// src/app/guards/admin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('AdminGuard: ', auth.isAdmin());

  if (auth.isAdmin()) {
    return true;
  }

  router.navigate(['/forbidden']);
  return false;
};
