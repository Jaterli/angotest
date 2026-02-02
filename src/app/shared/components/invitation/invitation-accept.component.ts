import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ModalComponent } from '../modal.component';
import { AuthService } from '../../services/auth.service';
import { InvitationService } from '../../services/invitation.service';
import { InvitationTestInfoComponent } from './invitation-testinfo.component';
import { CheckInvitationResponse } from '../../models/invitation.model';

@Component({
  selector: 'app-invitation-accept',
  standalone: true,
  imports: [CommonModule, ModalComponent, InvitationTestInfoComponent],
  templateUrl: './invitation-accept.component.html',
})
export class InvitationAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private invitationService = inject(InvitationService);
  private authService = inject(AuthService);

  token = '';

  loading = signal(true);
  error = signal<string>('');
  response = signal<CheckInvitationResponse | null>(null);
  showLoadingModal = signal(false);
  isAuthenticated = signal(false);

  currentUser = this.authService.currentUser;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.setError('No se proporcionó un token de invitación');
        return;
      }

      this.verifyAuthAndLoadInvitation();
    });
  }

  private verifyAuthAndLoadInvitation() {
    this.authService.verifyAuth().subscribe({
      next: () => {
        this.isAuthenticated.set(!!this.currentUser());
        this.checkInvitation();
      },
      error: () => {
        this.isAuthenticated.set(false);
        this.checkInvitation();
      }
    });
  }

  private checkInvitation() {
    this.invitationService.checkInvitation(this.token).subscribe({
      next: response => {
        this.response.set(response);

        // Auto-resume si corresponde
        // if (
        //   response.result_status === 'in_progress' &&
        //   response.current_user_id === response.invitation.guest_user_id
        // ) {

        //   this.navigateToTest(response.test.id);
        //   return;
        // }

        this.loading.set(false);
      },
      error: err => {
        this.setError(err.error?.error || 'Error verificando invitación');
      }
    });
  }



  async handleAction() {

    const r = this.response();
    if (!r) return;

    this.showLoadingModal.set(true);

    try {
      if (this.isAuthenticated()){

        if (r.result?.status == 'in_progress') {
            if (this.currentUser()!.id != r.invitation.guest_user_id) {
                if (r.invitation.guest_user_id && r.invitation.is_guest) {
                  // Reanudar test con el usuario autenticado
                  await this.acceptInvitation(false);
                  return;
                } else if (r.invitation.guest_user_id && !r.invitation.is_guest) {
                  // Test iniciado con otro usuario. Redireccionar a login
                  this.redirectToLogin('Inicia sesión con tu usuario para reanudar el test');
                  return;                            
                } else {
                  this.navigateToTest(r.test.id);
                  return;
                }                            
            }else if (this.currentUser()!.id == r.invitation.guest_user_id) {
              if (this.currentUser()!.role == 'user' && r.invitation.is_guest) {
                 await this.acceptInvitation(false); 
                 return;                
              }
              this.navigateToTest(r.test.id);
              return;
            } 

        } else if (r.result?.status == 'completed') {         
          
          if (this.currentUser()!.id != r.invitation.guest_user_id) {
              if (this.currentUser()!.role == 'user' && r.invitation.is_guest && r.invitation.guest_user_id) {
                // Test completado como invitado. Transferir resultados a usuario autenticado como "user"
                await this.acceptInvitation(false);
                return;
              
              } else if (this.currentUser()!.role == 'guest' && r.invitation.is_guest && r.invitation.guest_user_id) {
                // Test completado como invitado. Transferir resultados a usuario autenticado como "guest"
                await this.acceptInvitation(false);
                return;                 

              } else if (!r.invitation.is_guest && r.invitation.guest_user_id) {
                // Test completado con otro usuario. Redireccionar a login
                this.redirectToLogin('Inicia sesión con tu usuario para ver los resultados del test');
                return;

              } else {
                // Test completado con el usuario autenticado. Dar opción a completar de nuevo
                await this.acceptInvitation(false);
                return;                 
              }
          } else if (this.currentUser()!.id == r.invitation.guest_user_id) {
                this.handleViewResults();
                return;
          }
        } else {
            if (this.currentUser()!.role == 'user') {
              // Iniciar test con el usuario autenticado
              await this.acceptInvitation(false);
              return;              
            } else {
              // Iniciar test como invitado (guest)
              await this.acceptInvitation(true);
              return;
            }
        }

      } else {         
        // No autenticado   
          if (r.result?.status == 'in_progress') {
              if (r.invitation.guest_user_id && !r.invitation.is_guest) {
                this.redirectToLogin('Tienes un test en progreso. Inicia sesión para continuar');
                return;
              } else if (r.invitation.guest_user_id && r.invitation.is_guest) {
                  await this.acceptInvitation(false);
                  return;
              } 
          } else if (r.result?.status == 'completed') {                            
              if (r.invitation.guest_user_id && !r.invitation.is_guest) {
                this.redirectToLogin('Inicia sesión para ver tus resultados');
                return;
              } else if (r.invitation.guest_user_id && r.invitation.is_guest) {
                  await this.acceptInvitation(false);
                  // luego redirigir a resultados
                  // Esto falla porque lleva a la realización de test en vez de únicamente autenticarme con el guest_user_id
                  return;
              } 
          } else {
            //this.navigateToTest(r.test.id);
            await this.acceptInvitation(true);
            return;
          }
      }
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Error procesando la acción');
    } finally {
      this.showLoadingModal.set(false);
    }
  }


  // async handleAction() {
  //   const response = this.response();
  //   if (!response) return;

  //   const options = response.options;

  //   this.showLoadingModal.set(true);

  //   try {
  //     if (options.can_resume_test) {
  //       this.navigateToTest(response.test.id);
  //       return;
  //     }

  //     if (options.can_view_results) {
  //       this.handleViewResults();
  //       return;
  //     }

  //     if (options.can_login_to_start || options.can_login_to_resume || options.can_login_to_view) {
  //       this.redirectToLogin(options);
  //       return;
  //     }

  //     if (options.can_start_authenticated || options.can_start_with_authenticated) {
  //       await this.acceptInvitation(false);
  //       return;
  //     }

  //     if (options.can_start_as_guest && !this.isAuthenticated()) {
  //       await this.acceptInvitation(true);
  //       return;
  //     }

  //   } catch (err: any) {
  //     this.error.set(err?.error?.error || 'Error procesando la acción');
  //   } finally {
  //     this.showLoadingModal.set(false);
  //   }
  // }

  private async acceptInvitation(asGuest: boolean) {
    try {
      const acceptResponse = await firstValueFrom(
        this.invitationService.acceptInvitation(this.token, asGuest)
      );

      if (this.isAuthenticated() && this.response()!.result?.status === 'completed') {
        this.handleViewResults();
      } else {
        this.navigateToTest(acceptResponse.test_id);
      }

    } catch (error) {
      console.error('Error aceptando la invitación:', error);
    }
  }


  private redirectToLogin(message: string) {
    
    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: this.router.url,
        message 
      }
    });
  }


  handleViewResults() {
    const response = this.response();
    if (!response) return;
    this.router.navigate(['/tests/completed']);
  }

  navigateToTest(testId: number) {
    this.router.navigate(
      ['/tests', testId, 'start-single'],
      { queryParams: { invitation_token: this.token } }
    );
  }

  handleCompleteProfile() {
    this.router.navigate(['/user/profile'], {
      queryParams: {
        from_invitation: true,
        invitation_token: this.token,
        message: 'Completa tu perfil para ver tus resultados y acceder a todas las funciones'
      }
    });
  }

  private setError(message: string) {
    this.error.set(message);
    this.loading.set(false);
  }

  getExpirationDate(): Date {
    const expiresAt = this.response()?.invitation?.expires_at;
    return expiresAt ? new Date(expiresAt) : new Date();
  }
}
