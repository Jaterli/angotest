import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
 
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `bearer ${token}`
      }
    });
  }

  return next(req);
};
