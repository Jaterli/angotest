import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../modal.component';
import { InvitationService } from '../../services/invitation.service';

@Component({
  selector: 'app-invitation-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Invitar a realizar el test
      </h2>
      
      <form [formGroup]="invitationForm" (ngSubmit)="createInvitation()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email del invitado (opcional)
          </label>
          <input
            type="email"
            formControlName="email"
            placeholder="ejemplo@email.com"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Si no ingresas un email, el usuario podrá realizar el test como invitado
          </p>
        </div>
        
        <button
          type="submit"
          [disabled]="loading()"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (loading()) {
            <span class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando invitación...
            </span>
          } @else {
            Crear Enlace de Invitación
          }
        </button>
      </form>
      
      @if (invitationUrl()) {
        <div class="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <h3 class="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
            ¡Invitación creada exitosamente!
          </h3>
          <p class="text-sm text-emerald-700 dark:text-emerald-400 mb-3">
            Comparte este enlace con la persona que quieres invitar:
          </p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              [value]="invitationUrl()"
              readonly
              class="flex-1 px-3 py-2 text-sm border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              (click)="copyToClipboard()"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Copiar
            </button>
          </div>
          <p class="text-xs text-emerald-600 dark:text-emerald-500 mt-2">
            Este enlace expirará en 7 días
          </p>
        </div>
      }
    </div>

    <!-- Modal de éxito -->
    <app-modal
      [isOpen]="showSuccessModal()"
      title="¡Enlace copiado!"
      message="El enlace de invitación ha sido copiado al portapapeles. Compártelo con quien quieras invitar."
      icon="success"
      confirmText="Entendido"
      (confirm)="showSuccessModal.set(false)">
    </app-modal>
  `
})
export class InvitationCreateComponent {
  private fb = inject(FormBuilder);
  private invitationService = inject(InvitationService);
  
  @Input() testId!: number;
  
  invitationForm: FormGroup;
  
  loading = signal(false);
  invitationUrl = signal<string>('');
  showSuccessModal = signal(false);
  
  constructor() {
    this.invitationForm = this.fb.group({
      email: ['', [Validators.email]]
    });
  }
  
  createInvitation() {
    if (this.invitationForm.invalid) return;
    
    this.loading.set(true);
    const data = {
      test_id: this.testId, // Usa this.testId aquí
      email: this.invitationForm.value.email || null
    };
    
    this.invitationService.createInvitation(data).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.invitationUrl.set(response.invitation_url);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error creando invitación:', err);
      }
    });
  }
  
  copyToClipboard() {
    navigator.clipboard.writeText(this.invitationUrl());
    this.showSuccessModal.set(true);
  }
}