import { Routes } from '@angular/router';
import { authGuard, adminGuard, strictAuthGuard } from './guards/auth.guard';

export const APP_ROUTES: Routes = [
  
  { path: 'register', loadComponent: () => import('./shared/components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'login', loadComponent: () => import('./shared/components/login/login.component').then(m => m.LoginComponent) },
  { path: 'forgot-password', loadComponent: () => import('./shared/components/reset-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./shared/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'privacy', loadComponent: () => import('./shared/components/pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },  
  { path: 'terms', loadComponent: () => import('./shared/components/pages/terms-conditions/terms-conditions.component').then(m => m.TermsConditionsComponent) },
  { path: 'contact', loadComponent: () => import('./shared/components/pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'faqs', loadComponent: () => import('./shared/components/pages/faqs/faqs.component').then(m => m.FaqsComponent) },  
  { path: 'ai-integration', loadComponent: () => import('./shared/components/pages/ai-integration/ai-integration.component').then(m => m.AiIntegrationComponent) },    
  { path: 'home', loadComponent: () => import('./shared/components/pages/home/home.component').then(m => m.HomeComponent) },

  // Rutas de administración
  { path: 'admin/tests', loadComponent: () => import('./admin/tests/admin-test-list/admin-test-list.component').then(m => m.AdminTestListComponent), canActivate: [authGuard] },
  { path: 'admin/tests/create', loadComponent: () => import('./admin/tests/test-create/test-create.component').then(m => m.TestCreateComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/json-create', loadComponent: () => import('./admin/tests/test-create/test-json-create.component').then(m => m.TestJsonCreateComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/edit/:id', loadComponent: () => import('./admin/tests/test-edit/test-edit.component').then(m => m.TestEditComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/tests/delete/:id', loadComponent: () => import('./admin/tests/test-edit/test-edit.component').then(m => m.TestEditComponent), canActivate: [authGuard, adminGuard] },  
  { path: 'admin/users/stats', loadComponent: () => import('./admin/user/users-stats/users-stats.component').then(m => m.UsersStatsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/users/delete/:id', loadComponent: () => import('./admin/user/users-stats/users-stats.component').then(m => m.UsersStatsComponent), canActivate: [authGuard, adminGuard] },
  //{ path: 'admin/users/profile/:id', loadComponent: () => import('./admin/user/user-details/user-details.component').then(m => m.UserDetailsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/users/results/:id', loadComponent: () => import('./admin/user/user-results/user-results.component').then(m => m.UserResultsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/results', loadComponent: () => import('./admin/user/results-list/results-list.component').then(m => m.ResultsListComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/dashboard', loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [authGuard, adminGuard] },

  { path: 'admin/invitations', loadComponent: () => import('./admin/invitations-management/invitations-management.component').then(m => m.InvitationsManagementComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/quotas', loadComponent: () => import('./admin/quota-management/quota-management.component').then(m => m.QuotaManagementComponent), canActivate: [authGuard, adminGuard] },
  // Ruta para configuración del sistema
  { path: 'admin/system-config', loadComponent: () => import('./admin/system-config/system-config.component').then(m => m.SystemConfigComponent), canActivate: [authGuard, adminGuard] },

  // Rutas de usuario
  { path: 'tests/:id/start-single', loadComponent: () => import('./user/tests/test-single/test-single.component').then(m => m.TestSingleComponent), canActivate: [authGuard] },
  { path: 'tests/not-started', loadComponent: () => import('./user/tests/no-started/not-started-tests.component').then(m => m.NotStartedTestsComponent), canActivate: [authGuard] },
  { path: 'tests/completed', loadComponent: () => import('./user/tests/completed/completed-tests.component').then(m => m.CompletedTestsComponent), canActivate: [authGuard] },
  { path: 'tests/in-progress', loadComponent: () => import('./user/tests/in-progress/in-progress-tests.component').then(m => m.InProgressTestsComponent), canActivate: [authGuard] },  
  { path: 'user/profile', loadComponent: () => import('./user/profile/profile.component').then(m => m.ProfileComponent), canActivate: [strictAuthGuard] }, // strictAuthGuard: Fuerza refresco para datos sensibles

  // Rutas para dashboard de usuario
  { path: 'dashboard', loadComponent: () => import('./user/dashboard/dashboard.component').then (m => m.DashboardComponent), canActivate: [authGuard]},
  // Ruta para generación de tests con IA
  { path: 'generate-test', loadComponent: () => import('./shared/components/generate-test/generate-test.component').then(m => m.GenerateTestComponent), canActivate: [authGuard] },
  
  { path: 'invitation/accept', loadComponent: () => import('./shared/components/invitation/invitation-accept.component').then(m => m.InvitationAcceptComponent) },

  { path: 'forbidden', loadComponent: () => import('./shared/components/forbidden/forbidden.component').then(m => m.ForbiddenComponent), canActivate: [authGuard] },

  { path: '**', redirectTo: 'home' }
];