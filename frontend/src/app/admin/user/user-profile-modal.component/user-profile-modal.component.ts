import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/components/modal.component';
import { UserModalService } from '../../services/user-modal.service';
import { UsersManagementService } from '../../services/users-management.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './user-profile-modal.component.html'
})
export class UserProfileModalComponent implements OnInit, OnDestroy {
  
  private usersManagementService = inject(UsersManagementService);
  private userModalService = inject(UserModalService);
  private sharedUtilsService = inject(SharedUtilsService);
  private subscription?: Subscription;

  // Propiedades del modal
  isOpen = false;
  title = 'Estadísticas Detalladas del Usuario';
  userId: number | null = null;

  isLoading = signal(true);
  error: string | null = null;
  
  loadingProfile = signal(false);
  userProfile = signal<any | null>(null);
  showProfileModal = signal(false);
  profileError = signal<string | null>(null);

  ngOnInit() {
    // Suscribirse a los cambios del servicio
    this.subscription = this.userModalService.modalState$.subscribe(state => {
      this.isOpen = state.isOpen;
      
      if (state.isOpen && state.userId) {
        this.userId = state.userId;
        this.loadUserProfile(state.userId);
      } else {
        this.resetModal();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.userModalService.close();
  }

  // Método para cargar perfil de usuario
  loadUserProfile(userId: number): void {
    this.loadingProfile.set(true);
    this.profileError.set(null);
    
    this.usersManagementService.getUserProfile(userId).subscribe({
      next: (response) => {
        this.userProfile.set(response);
        this.showProfileModal.set(true);
        this.loadingProfile.set(false);
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.profileError.set('No se pudo cargar el perfil del usuario');
        this.loadingProfile.set(false);
      }
    });
  }

  // Método para mostrar perfil
  showProfile(userId: number): void {
    this.loadUserProfile(userId);
  }

  // Método para cerrar modal de perfil
  closeProfileModal(): void {
    this.showProfileModal.set(false);
    this.userProfile.set(null);
    this.profileError.set(null);
    this.userModalService.close();
  }

  private resetModal(): void {
    this.isLoading.set(false);
    this.userId = null;
    this.userProfile.set(null);
    this.showProfileModal.set(false);
    this.profileError.set(null);
  }

  // Helper methods
  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  getRoleBadgeClass(role: string): string {
    return this.sharedUtilsService.getSharedRoleBadgeClass(role);
  }

}