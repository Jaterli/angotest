import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const APP_ROUTES: Routes = [
  
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
 
  // Rutas de administración
  { path: 'admin/tests', loadComponent: () => import('./admin/tests/admin-test-list/admin-test-list.component').then(m => m.AdminTestListComponent), canActivate: [authGuard] },
  { path: 'admin/tests/create', loadComponent: () => import('./admin/tests/test-create/test-create.component').then(m => m.TestCreateComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/edit/:id', loadComponent: () => import('./admin/tests/test-edit/test-edit.component').then(m => m.TestEditComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/delete/:id', loadComponent: () => import('./admin/tests/test-edit/test-edit.component').then(m => m.TestEditComponent), canActivate: [authGuard, adminGuard] },  
  { path: 'admin/users/stats', loadComponent: () => import('./admin/tests/users-stats/users-stats.component').then(m => m.UsersStatsComponent), canActivate: [authGuard] },
  { path: 'admin/user/:id', loadComponent: () => import('./admin/user-details/user-details.component').then(m => m.UserDetailsComponent), canActivate: [authGuard, adminGuard] },

  // Rutas de usuario
  { path: 'test/:id', loadComponent: () => import('./user/tests/test-resolve/test-resolve.component').then(m => m.TestResolveComponent), canActivate: [authGuard] },
  { path: 'test/latest', loadComponent: () => import('./user/tests/latest-test/latest-test.component').then(m => m.LatestTestComponent) },
  { path: 'tests/results', loadComponent: () => import('./user/tests/user-test-list/user-test-list.component').then(m => m.UserTestListComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];