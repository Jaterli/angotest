import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Verificar autenticación con el backend
  try {
    const authCheck = await firstValueFrom(auth.verifyAuth());
    
    if (authCheck.authenticated) {
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
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    router.navigate(['/login'], {
      queryParams: {
        returnUrl: state.url,
        error: 'Error de conexión con el servidor'
      }
    });
    return false;
  }
};

// Guard para roles específicos
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return async (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    try {
      const authCheck = await firstValueFrom(auth.verifyAuth());
      
      if (!authCheck.authenticated) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      if (authCheck.user?.role !== requiredRole) {
        // Redirigir a página de acceso denegado o dashboard
        router.navigate(['/dashboard'], {
          queryParams: { error: 'Acceso denegado: rol insuficiente' }
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verificando rol:', error);
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
  };
};

// Guard para admin
export const adminGuard: CanActivateFn = roleGuard('admin');