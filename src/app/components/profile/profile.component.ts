import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangePasswordData, UserUpdateData } from '../../models/user.model';

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
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Formularios
  profileForm: FormGroup;
  passwordForm: FormGroup;

  // Estados
  loading = signal(false);
  loadingPassword = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);

  // Datos del usuario
  user = signal<any>(null);

  // Lista de países
  countries = [
    'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela',
    'Estados Unidos', 'Canadá', 'Reino Unido', 'Francia', 'Alemania', 'Italia',
    'Portugal', 'Brasil', 'Uruguay', 'Paraguay', 'Bolivia', 'Ecuador', 'Costa Rica',
    'Panamá', 'República Dominicana', 'Puerto Rico', 'Cuba', 'Guatemala',
    'Honduras', 'El Salvador', 'Nicaragua', 'Otro'
  ];

  constructor() {
    // Formulario de perfil
    this.profileForm = this.fb.group({
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

    // Formulario de cambio de contraseña
    this.passwordForm = this.fb.group({
      currentPassword: ['', [
        Validators.required
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  // Validador para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Cargar datos del usuario
  loadUserData() {
    this.loading.set(true);
    this.authService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const user = response.user;
          this.user.set(user);
          
          // Formatear fecha para el input type="date"
          const birthDate = new Date(user.birth_date);
          const formattedDate = birthDate.toISOString().split('T')[0];
          
          this.profileForm.patchValue({
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone || '',
            address: user.address || '',
            country: user.country,
            birthDate: formattedDate
          });
          
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
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get phone() { return this.profileForm.get('phone'); }
  get address() { return this.profileForm.get('address'); }
  get country() { return this.profileForm.get('country'); }
  get birthDate() { return this.profileForm.get('birthDate'); }

  // Getters para el formulario de contraseña
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

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

  // Actualizar perfil
  updateProfile() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const userData: UserUpdateData = {
      first_name: this.profileForm.value.firstName,
      last_name: this.profileForm.value.lastName,
      phone: this.profileForm.value.phone || '',
      address: this.profileForm.value.address || '',
      country: this.profileForm.value.country,
      birth_date: this.profileForm.value.birthDate
    };

    this.authService.updateUser(userData)
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

  // Cambiar contraseña
  changePassword() {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loadingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    const passwordData: ChangePasswordData = {
      current_password: this.passwordForm.value.currentPassword,
      new_password: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(passwordData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loadingPassword.set(false);
          this.passwordSuccess.set(response.message || 'Contraseña actualizada correctamente');
          this.passwordForm.reset();
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => {
            this.passwordSuccess.set(null);
          }, 5000);
        },
        error: (err: any) => {
          this.loadingPassword.set(false);
          this.passwordError.set(err.error?.error || 'Error al cambiar la contraseña');
        }
      });
  }
}