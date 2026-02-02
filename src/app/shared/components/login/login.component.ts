import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal<string | null>(null);
  returnUrl: string | null = null;
  message = signal<string | null>(null); // Nueva señal para el mensaje

  ngOnInit() {
    // Obtener los parámetros de la query string
    this.route.queryParamMap.subscribe(params => {
      this.returnUrl = params.get('returnUrl');
      const messageParam = params.get('message');
      
      // Si existe el parámetro message, asignarlo a la señal
      if (messageParam) {
        this.message.set(messageParam);
      }
    });

    // Cerrar sesión si se accede a /login
    if (!!this.auth.currentUser()) {
      this.auth.logout();
    }
  }

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
        console.log('Login exitoso');
        this.loading.set(false);
        
        // Si hay returnUrl, redirigir allí
        if (this.returnUrl) {
          console.log('Redirigiendo a returnUrl:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
          return;
        }
        
        // Si no hay returnUrl, continuar con la lógica original
        if (response.user.role !== 'admin') {
          this.router.navigate(['/tests/not-started']);
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

  // Método para limpiar el mensaje (opcional, para cerrar el mensaje manualmente)
  clearMessage() {
    this.message.set(null);
  }

  // Getters para template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}