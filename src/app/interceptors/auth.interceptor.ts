import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  // Clonar la solicitud para agregar withCredentials
  // Esto asegura que las cookies se envíen automáticamente
  const reqWithCredentials = req.clone({
    withCredentials: true
  });
  
  return next(reqWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores de autenticación
      if (error.status === 401) {
        // Token inválido o expirado
        console.log('Token inválido o expirado, cerrando sesión...');
        
        // Limpiar estado local
        auth.logout(false);
        
        // Redirigir a login con mensaje
        router.navigate(['/login'], {
          queryParams: {
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            returnUrl: router.url
          }
        });
      }
      
      if (error.status === 403) {
        // Acceso denegado (permisos insuficientes)
        console.log('Acceso denegado: permisos insuficientes');
        
        // Redirigir a página de acceso denegado o dashboard
        router.navigate(['/forbidden'], {
          queryParams: { error: 'Acceso denegado' }
        });
      }
      
      return throwError(() => error);
    })
  );
};