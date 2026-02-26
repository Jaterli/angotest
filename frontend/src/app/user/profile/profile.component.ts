import { Component, OnInit, signal, inject, DestroyRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserUpdateData } from '../../shared/models/user.models';
import { UserService } from '../../shared/services/user.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { DeactivateAccountModalComponent } from '../delete-account/delete-account-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DeactivateAccountModalComponent,
    ModalComponent
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Referencia al modal de eliminación
  @ViewChild(DeactivateAccountModalComponent) deactivateModal!: DeactivateAccountModalComponent;

  // Formularios (existentes)
  profileForm: FormGroup;
  emailPasswordForm: FormGroup;
  guestCompleteForm: FormGroup;

  // Estados (existentes)
  loading = signal(false);
  loadingEmailPassword = signal(false);
  loadingGuestUpdate = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  emailPasswordError = signal<string | null>(null);
  emailPasswordSuccess = signal<string | null>(null);

  // Nuevos estados para eliminación
  deactivatingAccount = signal(false);
  deactivateError = signal<string | null>(null);
  showDeactivateModal = signal(false);

  // Modal de confirmación exitosa

  showSuccessModal = signal(false);

  // Datos del usuario
  user = signal<any>(null);

  // Control de visibilidad del formulario de email/password
  showEmailPasswordForm = signal(false);

  // Lista de países
  countries = [
    'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela',
    'Estados Unidos', 'Canadá', 'Reino Unido', 'Francia', 'Alemania', 'Italia',
    'Portugal', 'Brasil', 'Uruguay', 'Paraguay', 'Bolivia', 'Ecuador', 'Costa Rica',
    'Panamá', 'República Dominicana', 'Puerto Rico', 'Cuba', 'Guatemala',
    'Honduras', 'El Salvador', 'Nicaragua', 'Otro'
  ];

  constructor() {
    // Formularios existentes (mantener igual)
    this.profileForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-Z0-9_.-]+$')
      ]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$') // solo letras y espacios

      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$') // solo letras y espacios
      ]],
      phone: ['', [
        Validators.pattern('^[0-9+\-\s()]{7,15}$')
      ]],
      address: ['', [
        Validators.maxLength(200)
      ]],
      country: ['', [
        Validators.required
      ]],
      birthDate: ['', [
        Validators.required
      ]]
    });

    this.emailPasswordForm = this.fb.group({
      newEmail: ['', [
        Validators.required,
        Validators.email
      ]],
      confirmEmail: ['', [
        Validators.required,
        Validators.email
      ]],
      currentPassword: ['', [
        Validators.required
      ]],
      newPassword: ['', [
        Validators.minLength(6),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['']
    }, {
      validators: [
        this.emailMatchValidator,
        this.passwordMatchOrEmptyValidator
      ]
    });

    this.guestCompleteForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-Z0-9_.-]+$')
      ]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$') // solo letras y espacios
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$') // solo letras y espacios
      ]],
      phone: ['', [
        Validators.pattern('^[0-9+\-\s()]{7,15}$')
      ]],
      address: ['', [
        Validators.maxLength(200)
      ]],
      country: ['', [
        Validators.required
      ]],
      birthDate: ['', [
        Validators.required
      ]],
      newEmail: ['', [
        Validators.required,
        Validators.email
      ]],
      confirmEmail: ['', [
        Validators.required,
        Validators.email
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: [
        this.emailMatchValidator,
        this.passwordMatchValidator
      ]
    });
  }

  ngOnInit() {   
    this.loadUserData();
  }

  // ========== FUNCIONES PARA ELIMINACIÓN DE CUENTA ==========

  // Abrir modal de eliminación
  openDeactivateAccountModal(): void {   
    this.showDeactivateModal.set(true);
    this.deactivateError.set(null);
  }

  // Procesar eliminación de cuenta
  onDeactivateAccount(data: { current_password: string; confirm_text: string }): void {
    this.deactivatingAccount.set(true);
    this.deactivateError.set(null); // Limpiar error anterior

    this.userService.deactivateAccount(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.deactivatingAccount.set(false);
          this.showDeactivateModal.set(false);
          
          // Mostrar modal de éxito
          this.showSuccessModal.set(true);
        },
        error: (err: any) => {
          this.deactivatingAccount.set(false);
          
          // Mostrar error del backend
          if (err.error?.error) {
            this.deactivateError.set(err.error.error);
          } else if (err.status === 401) {
            this.deactivateError.set('No estás autorizado para realizar esta acción');
          } else if (err.status === 403) {
            this.deactivateError.set('No tienes permiso para realizar esta acción');
          } else if (err.status === 404) {
            this.deactivateError.set('Usuario no encontrado');
          } else if (err.status === 500) {
            this.deactivateError.set('Error interno del servidor');
          } else {
            this.deactivateError.set('Error al eliminar la cuenta');
          }
          
          // No cerrar el modal automáticamente cuando hay error
          // El error se mostrará en el modal y el usuario podrá intentar de nuevo
        }
      });
  }

  // Limpiar el error cuando el usuario cierre el modal
  onCancelDeactivate(): void {
    this.showDeactivateModal.set(false);
    this.deactivateError.set(null); // Limpiar error al cancelar
  }


  // Después de éxito, cerrar sesión y redirigir
  onAccountDeactivatedSuccess(): void {
    this.showSuccessModal.set(false);
    
    // Limpiar datos de usuario localmente
    this.user.set(null);
    
    // Redirigir a la página de inicio o login
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1000);
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};
    
    if (!hasUpperCase) {
      errors['missingUpperCase'] = true;
    }
    if (!hasLowerCase) {
      errors['missingLowerCase'] = true;
    }
    if (!hasNumbers) {
      errors['missingNumber'] = true;
    }
    if (!hasSpecialChar) {
      errors['missingSpecialChar'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  emailMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newEmail = form.get('newEmail')?.value;
    const confirmEmail = form.get('confirmEmail')?.value;
    
    if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      form.get('confirmEmail')?.setErrors({ emailMismatch: true });
      return { emailMismatch: true };
    }
    
    if (newEmail === confirmEmail) {
      form.get('confirmEmail')?.setErrors(null);
    }
    
    return null;
  }

  passwordMatchOrEmptyValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword) {
      if (!confirmPassword) {
        form.get('confirmPassword')?.setErrors({ required: true });
        return { confirmPasswordRequired: true };
      }
      
      if (newPassword !== confirmPassword) {
        form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
    }
    
    if (!newPassword && confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    if (newPassword === confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    return null;
  }

  passwordMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (newPassword === confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    return null;
  }

  loadUserData() {
    this.loading.set(true);
    this.userService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const user = response.user;
          this.user.set(user);
          
          const birthDate = new Date(user.birth_date);
          const formattedDate = birthDate.toISOString().split('T')[0];
          
          if (user.role === 'guest') {
            this.guestCompleteForm.patchValue({
              username: user.username || '',
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              phone: user.phone || '',
              address: user.address || '',
              country: user.country || '',
              birthDate: formattedDate || ''
            });
          } else {
            this.profileForm.patchValue({
              username: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone || '',
              address: user.address || '',
              country: user.country,
              birthDate: formattedDate
            });
            
            this.emailPasswordForm.patchValue({
              newEmail: user.email,
              confirmEmail: user.email
            });
          }
          
          this.loading.set(false);
        },
        error: (err: any) => {
          this.errorMessage.set('Error al cargar los datos del usuario');
          this.loading.set(false);
          if (err.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      });
  }

  // Getters (mantener igual)
  get username() { return this.profileForm.get('username'); }
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get phone() { return this.profileForm.get('phone'); }
  get address() { return this.profileForm.get('address'); }
  get country() { return this.profileForm.get('country'); }
  get birthDate() { return this.profileForm.get('birthDate'); }

  get newEmail() { return this.emailPasswordForm.get('newEmail'); }
  get confirmEmail() { return this.emailPasswordForm.get('confirmEmail'); }
  get currentPassword() { return this.emailPasswordForm.get('currentPassword'); }
  get newPassword() { return this.emailPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.emailPasswordForm.get('confirmPassword'); }

  get guestUsername() { return this.guestCompleteForm.get('username'); }
  get guestFirstName() { return this.guestCompleteForm.get('firstName'); }
  get guestLastName() { return this.guestCompleteForm.get('lastName'); }
  get guestPhone() { return this.guestCompleteForm.get('phone'); }
  get guestAddress() { return this.guestCompleteForm.get('address'); }
  get guestCountry() { return this.guestCompleteForm.get('country'); }
  get guestBirthDate() { return this.guestCompleteForm.get('birthDate'); }
  get guestNewEmail() { return this.guestCompleteForm.get('newEmail'); }
  get guestConfirmEmail() { return this.guestCompleteForm.get('confirmEmail'); }
  get guestNewPassword() { return this.guestCompleteForm.get('newPassword'); }
  get guestConfirmPassword() { return this.guestCompleteForm.get('confirmPassword'); }

  getMinBirthDate(): string {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  }

  getMaxBirthDate(): string {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  }

  toggleEmailPasswordForm() {
    this.showEmailPasswordForm.set(!this.showEmailPasswordForm());
    if (!this.showEmailPasswordForm()) {
      this.emailPasswordForm.patchValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      this.emailPasswordError.set(null);
      this.emailPasswordSuccess.set(null);
    }
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const currentUser = this.user();
    const formValues = this.profileForm.value;
    
    if (currentUser.username !== formValues.username) {
      if (!confirm('¿Estás seguro de que quieres cambiar tu nombre de usuario?')) {
        return;
      }
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const userData: UserUpdateData = {
      username: this.profileForm.value.username,
      email: this.user().email,
      first_name: this.profileForm.value.firstName,
      last_name: this.profileForm.value.lastName,
      phone: this.profileForm.value.phone || '',
      address: this.profileForm.value.address || '',
      country: this.profileForm.value.country,
      birth_date: this.profileForm.value.birthDate
    };

    this.userService.updateUser(userData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          this.successMessage.set(response.message || 'Datos actualizados correctamente');
          this.user.set(response.user);          
        },
        error: (err: any) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.error || 'Error al actualizar los datos');
        }
      });
  }

  updateEmailPassword() {
    if (this.emailPasswordForm.invalid) {
      Object.keys(this.emailPasswordForm.controls).forEach(key => {
        const control = this.emailPasswordForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formValues = this.emailPasswordForm.value;
    const currentUser = this.user();
    
    const isEmailChanged = formValues.newEmail !== currentUser.email;
    const isPasswordChanged = !!formValues.newPassword;
    
    if (!isEmailChanged && !isPasswordChanged) {
      this.emailPasswordError.set('No se han realizado cambios en el email ni contraseña');
      return;
    }

    if (isEmailChanged) {
      if (!confirm('¿Estás seguro de que quieres cambiar tu email?')) {
        return;
      }
    }

    this.loadingEmailPassword.set(true);
    this.emailPasswordError.set(null);
    this.emailPasswordSuccess.set(null);

    const emailPasswordData = {
      current_password: formValues.currentPassword,
      ...(isEmailChanged && { new_email: formValues.newEmail }),
      ...(isPasswordChanged && { new_password: formValues.newPassword })
    };

    this.userService.updateEmailPassword(emailPasswordData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loadingEmailPassword.set(false);
          
          let message = '';
          if (isEmailChanged && isPasswordChanged) {
            message = 'Email y contraseña actualizados correctamente. Revisa tu nuevo email para confirmar el cambio.';
          } else if (isEmailChanged) {
            message = 'Email actualizado correctamente. Revisa tu nuevo email para confirmar el cambio.';
          } else {
            message = 'Contraseña actualizada correctamente.';
          }
          
          this.emailPasswordSuccess.set(response.message || message);
          
          if (isEmailChanged && response.user) {
            this.user.set(response.user);
          }
          
          this.emailPasswordForm.patchValue({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          
          setTimeout(() => {
            this.emailPasswordSuccess.set(null);
            if (response.user) {
              this.showEmailPasswordForm.set(false);
            }
          }, 5000);
        },
        error: (err: any) => {
          this.loadingEmailPassword.set(false);
          this.emailPasswordError.set(err.error?.error || 'Error al actualizar el email o contraseña');
        }
      });
  }

  completeGuestProfile() {
    if (this.guestCompleteForm.invalid) {
      Object.keys(this.guestCompleteForm.controls).forEach(key => {
        const control = this.guestCompleteForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loadingGuestUpdate.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.guestCompleteForm.value;
    
    const updateData = {
      username: formValues.username,
      email: formValues.newEmail,
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      phone: formValues.phone || '',
      address: formValues.address || '',
      country: formValues.country,
      birth_date: formValues.birthDate,
      new_password: formValues.newPassword,
      current_password: 'temporary_password'
    };

    this.userService.updateGuestProfile(updateData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loadingGuestUpdate.set(false);
          this.successMessage.set(response.message || 'Perfil completado correctamente.');
          this.user.set(response.user);
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        },
        error: (err: any) => {
          this.loadingGuestUpdate.set(false);
          this.errorMessage.set(err.error?.error || 'Error al completar el perfil');
        }
      });
  }

  closeToast() {
      this.errorMessage.set(null);
      this.successMessage.set(null);
  }
}