import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const APP_ROUTES: Routes = [
  
  { path: 'register', loadComponent: () => import('./shared/components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'login', loadComponent: () => import('./shared/components/login/login.component').then(m => m.LoginComponent) },
  
  // Rutas de administración
  { path: 'admin/tests', loadComponent: () => import('./admin/tests/admin-test-list/admin-test-list.component').then(m => m.AdminTestListComponent), canActivate: [authGuard] },
  { path: 'admin/tests/create', loadComponent: () => import('./admin/tests/test-create/test-create.component').then(m => m.TestCreateComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/json-create', loadComponent: () => import('./admin/tests/test-create/test-json-create.component').then(m => m.TestJsonCreateComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/edit/:id', loadComponent: () => import('./admin/tests/test-edit/test-edit.component').then(m => m.TestEditComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/delete/:id', loadComponent: () => import('./admin/tests/test-edit/test-edit.component').then(m => m.TestEditComponent), canActivate: [authGuard, adminGuard] },  
  { path: 'admin/users/stats', loadComponent: () => import('./admin/users-stats/users-stats.component').then(m => m.UsersStatsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/users/delete/:id', loadComponent: () => import('./admin/users-stats/users-stats.component').then(m => m.UsersStatsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/users/profile/:id', loadComponent: () => import('./admin/user-profile/user-profile.component').then(m => m.UserDetailsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/users/results/:id', loadComponent: () => import('./admin/user-results/user-results.component').then(m => m.UserResultsComponent), canActivate: [authGuard, adminGuard] },
  
  // Rutas de usuario
  //{ path: 'tests/:id/start', loadComponent: () => import('./user/tests/test-resolve/test-resolve.component').then(m => m.TestResolveComponent), canActivate: [authGuard] },
  { path: 'tests/:id/start-single', loadComponent: () => import('./user/tests/test-single/test-single.component').then(m => m.TestSingleComponent), canActivate: [authGuard] },
  //{ path: 'tests/:id/resume', loadComponent: () => import('./user/tests/test-resolve/test-resolve.component').then(m => m.TestResolveComponent), canActivate: [authGuard] },
  { path: 'tests/list', loadComponent: () => import('./user/tests/tests-list/tests-list.component').then(m => m.TestsListComponent), canActivate: [authGuard] },
  { path: 'tests/not-started', loadComponent: () => import('./user/tests/no-started/not-started-tests.component').then(m => m.NotStartedTestsComponent), canActivate: [authGuard] },
  { path: 'tests/completed', loadComponent: () => import('./user/tests/completed/completed-tests.component').then(m => m.CompletedTestsComponent), canActivate: [authGuard] },
  { path: 'tests/in-progress', loadComponent: () => import('./user/tests/in-progress/in-progress-tests.component').then(m => m.InProgressTestsComponent), canActivate: [authGuard] },
  { path: 'tests/results', loadComponent: () => import('./user/tests/user-test-results/user-test-results.component').then(m => m.UserTestResultsComponent), canActivate: [authGuard] },
  { path: 'user/profile', loadComponent: () => import('./user/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },


  // Ruta para generación de tests con IA
  { path: 'generate-test', loadComponent: () => import('./shared/components/generate-test/generate-test.component').then(m => m.GenerateTestComponent), canActivate: [authGuard] },
  

  { path: '**', redirectTo: 'login' }
];