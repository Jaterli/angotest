import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'admin/tests', loadComponent: () => import('./admin/tests/admin-test-list/admin-test-list.component').then(m => m.AdminTestListComponent), canActivate: [authGuard] },
  { path: 'test/:id', loadComponent: () => import('./user/tests/test-resolve/test-resolve.component').then(m => m.TestResolveComponent), canActivate: [authGuard] },
  { path: 'test/latest', loadComponent: () => import('./user/tests/latest-test/latest-test.component').then(m => m.LatestTestComponent) },
  { path: 'admin/test/create', loadComponent: () => import('./admin/tests/test-create/test-create.component').then(m => m.TestCreateComponent) },
  { path: 'admin/users/stats', loadComponent: () => import('./admin/tests/users-stats/users-stats.component').then(m => m.UsersStatsComponent), canActivate: [authGuard] }, //canActivate: [authGuard, adminGuard] },
  { path: 'tests/results', loadComponent: () => import('./user/tests/user-test-list/user-test-list.component').then(m => m.UserTestListComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];