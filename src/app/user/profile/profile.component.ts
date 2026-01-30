import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserUpdateData } from '../../shared/models/user.model';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Formulario principal (para usuarios normales)
  profileForm: FormGroup;
  emailPasswordForm: FormGroup;
  
  // Formulario para usuarios guest (completo)
  guestCompleteForm: FormGroup;

  // Estados
  loading = signal(false);
  loadingEmailPassword = signal(false);
  loadingGuestUpdate = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  emailPasswordError = signal<string | null>(null);
  emailPasswordSuccess = signal<string | null>(null);

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
    // Formulario de perfil (para usuarios normales)
    this.profileForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-Z0-9_.-]+$')
      ]],
      firstName: ['', [
        Validators.required,
        Validators.maxLength(50)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.maxLength(50)
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

    // Formulario de cambio de email y contraseña (para usuarios normales)
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

    // Formulario completo para usuarios guest (con email y contraseña obligatorios)
    this.guestCompleteForm = this.fb.group({
      // Datos personales
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-Z0-9_.-]+$')
      ]],
      firstName: ['', [
        Validators.required,
        Validators.maxLength(50)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.maxLength(50)
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
      
      // Credenciales obligatorias para guest
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

  // Validador personalizado para fortaleza de contraseña
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

  // Validador para coincidencia de emails
  emailMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newEmail = form.get('newEmail')?.value;
    const confirmEmail = form.get('confirmEmail')?.value;
    
    if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      form.get('confirmEmail')?.setErrors({ emailMismatch: true });
      return { emailMismatch: true };
    }
    
    // Limpiar error si coinciden
    if (newEmail === confirmEmail) {
      form.get('confirmEmail')?.setErrors(null);
    }
    
    return null;
  }

  // Validador para contraseñas (debe coincidir si se proporciona alguna)
  passwordMatchOrEmptyValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    // Si se proporciona nueva contraseña, validar confirmación
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
    
    // Si no hay nueva contraseña, limpiar errores de confirmación
    if (!newPassword && confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    // Limpiar errores si coinciden
    if (newPassword === confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    return null;
  }

  // Validador para contraseñas (para guest - siempre obligatorio)
  passwordMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    // Limpiar error si coinciden
    if (newPassword === confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    return null;
  }

  // Cargar datos del usuario
  loadUserData() {
    this.loading.set(true);
    this.userService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const user = response.user;
          this.user.set(user);
          
          // Formatear fecha para el input type="date"
          const birthDate = new Date(user.birth_date);
          const formattedDate = birthDate.toISOString().split('T')[0];
          
          if (user.role === 'guest') {
            // Para guest, pre-llenar solo algunos campos si existen
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
            // Para usuarios normales
            this.profileForm.patchValue({
              username: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone || '',
              address: user.address || '',
              country: user.country,
              birthDate: formattedDate
            });
            
            // Pre-llenar el email actual en el formulario de email/password
            this.emailPasswordForm.patchValue({
              newEmail: user.email,
              confirmEmail: user.email
            });
          }
          
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set('Error al cargar los datos del usuario');
          this.loading.set(false);
          // Redirigir a login si no está autenticado
          if (err.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      });
  }

  // Getters para el formulario de perfil
  get username() { return this.profileForm.get('username'); }
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get phone() { return this.profileForm.get('phone'); }
  get address() { return this.profileForm.get('address'); }
  get country() { return this.profileForm.get('country'); }
  get birthDate() { return this.profileForm.get('birthDate'); }

  // Getters para el formulario de email/password
  get newEmail() { return this.emailPasswordForm.get('newEmail'); }
  get confirmEmail() { return this.emailPasswordForm.get('confirmEmail'); }
  get currentPassword() { return this.emailPasswordForm.get('currentPassword'); }
  get newPassword() { return this.emailPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.emailPasswordForm.get('confirmPassword'); }

  // Getters para el formulario de guest
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

  // Calcular edad mínima y máxima
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

  // Toggle para mostrar/ocultar formulario de email/password
  toggleEmailPasswordForm() {
    this.showEmailPasswordForm.set(!this.showEmailPasswordForm());
    if (!this.showEmailPasswordForm()) {
      // Resetear solo algunos campos, mantener el email actual
      const currentEmail = this.user()?.email;
      this.emailPasswordForm.patchValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      this.emailPasswordError.set(null);
      this.emailPasswordSuccess.set(null);
    }
  }

  // Actualizar perfil (para usuarios normales)
  updateProfile() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Validar si hay cambios en username
    const currentUser = this.user();
    const formValues = this.profileForm.value;
    
    if (currentUser.username !== formValues.username) {
      // Mostrar confirmación para cambios críticos
      if (!confirm('¿Estás seguro de que quieres cambiar tu nombre de usuario? Esto puede afectar tu acceso al sistema.')) {
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const userData: UserUpdateData = {
      username: this.profileForm.value.username,
      email: this.user().email, // Email no se cambia aquí
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
          this.success.set(response.message || 'Datos actualizados correctamente');
          this.user.set(response.user);
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => {
            this.success.set(null);
          }, 5000);
        },
        error: (err: any) => {
          this.loading.set(false);
          this.error.set(err.error?.error || 'Error al actualizar los datos');
        }
      });
  }

  // Cambiar email y/o contraseña (para usuarios normales)
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
    
    // Verificar si el email ha cambiado
    const isEmailChanged = formValues.newEmail !== currentUser.email;
    const isPasswordChanged = !!formValues.newPassword;
    
    if (!isEmailChanged && !isPasswordChanged) {
      this.emailPasswordError.set('No se han realizado cambios en el email ni contraseña');
      return;
    }

    // Confirmación para cambios de email
    if (isEmailChanged) {
      if (!confirm('¿Estás seguro de que quieres cambiar tu email? A partir de este momento tendrás que iniciar sesión con tu nueva dirección.')) {
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
          
          // Limpiar mensaje después de 5 segundos
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

  // Completar perfil para usuarios guest
  completeGuestProfile() {
    if (this.guestCompleteForm.invalid) {
      Object.keys(this.guestCompleteForm.controls).forEach(key => {
        const control = this.guestCompleteForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loadingGuestUpdate.set(true);
    this.error.set(null);
    this.success.set(null);

    const formValues = this.guestCompleteForm.value;
    
    // Crear datos para actualizar perfil y credenciales
    const updateData = {
      username: formValues.username,
      email: formValues.newEmail, // Nuevo email obligatorio
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      phone: formValues.phone || '',
      address: formValues.address || '',
      country: formValues.country,
      birth_date: formValues.birthDate,
      new_password: formValues.newPassword, // Nueva contraseña obligatoria
      // Para guest, la contraseña actual es la temporal que le dieron
      // Puedes requerirla o usar un endpoint especial
      current_password: 'temporary_password' // Esto debería venir del backend o ser manejado de otra forma
    };

    // Nota: Necesitarás un endpoint especial para usuarios guest
    // o modificar el endpoint existente para manejar el caso guest
    this.userService.updateGuestProfile(updateData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loadingGuestUpdate.set(false);
          this.success.set(response.message || 'Perfil completado correctamente. Ahora eres un usuario permanente.');
          this.user.set(response.user);
          
          // Recargar la página o redirigir después de éxito
          setTimeout(() => {
            window.location.reload(); // O redirigir a dashboard
          }, 3000);
        },
        error: (err: any) => {
          this.loadingGuestUpdate.set(false);
          this.error.set(err.error?.error || 'Error al completar el perfil');
        }
      });
  }
}