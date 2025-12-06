import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    // Marcar todos los controles como touched
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    const { email, password } = this.loginForm.value;
    
    this.auth.login(email || '', password || '').subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.loading.set(false);
        if (response.user.role === 'user') {
          this.router.navigate(['/tests/results']);
          return;
        }
        this.router.navigate(['/admin/tests']);
      },
      error: (err) => {
        console.error('Error en login:', err);        
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Credenciales inválidas');
      },
      complete: () => {
        console.log('Login observable completado');
      }
    });
  }

  // Getters para template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}