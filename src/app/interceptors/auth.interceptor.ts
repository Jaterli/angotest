import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  
  return next(req.clone({
    setHeaders: auth.getToken()
      ? { Authorization: `Bearer ${auth.getToken()}` }
      : {}
  })).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};