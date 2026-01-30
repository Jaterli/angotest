import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Usamos observable en lugar de async/await para mejor integración
  return auth.verifyAuth().pipe(
    map(authCheck => {
      if (authCheck.authenticated && authCheck.user) {
        return true;
      } else {
        console.log('Usuario no autenticado, redirigiendo al login...');
        router.navigate(['/login'], {
          queryParams: {
            returnUrl: state.url,
            message: 'Por favor, inicia sesión para acceder a esta página'
          }
        });
        return false;
      }
    }),
    catchError((error) => {
      console.error('Error verificando autenticación:', error);
      router.navigate(['/login'], {
        queryParams: {
          returnUrl: state.url,
          error: error.status === 401 ? 'Sesión expirada' : 'Error de conexión con el servidor'
        }
      });
      return of(false);
    })
  );
};

// Guard para roles específicos con cache optimizado
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Primero verificamos si ya tenemos el usuario en cache
    const cachedUser = auth.currentUser();
    
    if (cachedUser) {
      if (cachedUser.role === requiredRole) {
        return true;
      } else {
        router.navigate(['/forbidden'], {
          queryParams: { error: 'Acceso denegado: rol insuficiente' }
        });
        return false;
      }
    }

    // Si no hay cache, hacemos la petición
    return auth.verifyAuth().pipe(
      map(authCheck => {
        if (!authCheck.authenticated || !authCheck.user) {
          router.navigate(['/login'], {
            queryParams: { 
              returnUrl: state.url,
              message: 'Por favor, inicia sesión'
            }
          });
          return false;
        }

        if (authCheck.user.role !== requiredRole) {
          router.navigate(['/forbidden'], {
            queryParams: { error: 'Acceso denegado: rol insuficiente' }
          });
          return false;
        }

        return true;
      }),
      catchError((error) => {
        console.error('Error verificando rol:', error);
        router.navigate(['/login'], {
          queryParams: { 
            returnUrl: state.url,
            error: 'Error de autenticación'
          }
        });
        return of(false);
      })
    );
  };
};

// Guard para admin
export const adminGuard: CanActivateFn = roleGuard('admin');

// Guard que fuerza refresco de autenticación (útil para rutas críticas)
export const strictAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.refreshAuth().pipe(
    map(authCheck => {
      if (authCheck.authenticated) {
        return true;
      } else {
        router.navigate(['/login'], {
          queryParams: {
            returnUrl: state.url,
            message: 'Sesión expirada'
          }
        });
        return false;
      }
    }),
    catchError((error) => {
      console.error('Error en autenticación estricta:', error);
      router.navigate(['/login'], {
        queryParams: {
          returnUrl: state.url,
          error: 'Error de autenticación'
        }
      });
      return of(false);
    })
  );
};