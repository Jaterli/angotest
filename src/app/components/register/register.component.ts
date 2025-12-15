import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Lista de países para el dropdown
  countries = [
    'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela',
    'Estados Unidos', 'Canadá', 'Reino Unido', 'Francia', 'Alemania', 'Italia',
    'Portugal', 'Brasil', 'Uruguay', 'Paraguay', 'Bolivia', 'Ecuador', 'Costa Rica',
    'Panamá', 'República Dominicana', 'Puerto Rico', 'Cuba', 'Guatemala',
    'Honduras', 'El Salvador', 'Nicaragua', 'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [
        Validators.required
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
      country: ['', [ // ← NUEVO CAMPO
        Validators.required
      ]],
      birthDate: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }


  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Métodos para facilitar el acceso a los controles en el template
  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get phone() { return this.registerForm.get('phone'); }
  get address() { return this.registerForm.get('address'); }
  get country() { return this.registerForm.get('country'); }  
  get birthDate() { return this.registerForm.get('birthDate'); }

  // Calcular edad mínima (18 años)
  getMinBirthDate(): string {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  }

  // Calcular edad máxima (100 años)
  getMaxBirthDate(): string {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

  // Asegurar que la fecha esté en formato YYYY-MM-DD
    const birthDate = new Date(this.registerForm.value.birthDate);
    const formattedDate = birthDate.toISOString().split('T')[0];

    // Preparar datos para el backend
    const formData = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      first_name: this.registerForm.value.firstName,
      last_name: this.registerForm.value.lastName,
      phone: this.registerForm.value.phone || '',
      address: this.registerForm.value.address || '',
      country: this.registerForm.value.country,      
      birth_date: formattedDate
    };

    this.authService.register(formData).
    subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true' } 
          });
        }, 5000);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al registrar el usuario');
      }
    });
  }
}