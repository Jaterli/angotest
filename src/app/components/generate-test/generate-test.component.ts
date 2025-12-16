// components/generate-test/generate-test.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../modal.component';
import { GenerateTestRequest, UserQuota } from '../../models/generate-test.model';
import { AITestService } from '../../services/generate-test.service';

@Component({
  selector: 'app-generate-test',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './generate-test.component.html'
})
export class GenerateTestComponent implements OnInit {
  generateForm: FormGroup;
  loading = signal(false);
  quotaLoading = signal(false);
  generating = signal(false);
  error = signal<string | null>(null);
  
  quota = signal<UserQuota | null>(null);
  requestId = signal<number | null>(null);
  checkInterval: any;
  
  // Opciones predefinidas
  topics = [
    'Programación', 'Matemáticas', 'Historia', 'Ciencia',
    'Literatura', 'Geografía', 'Arte', 'Deportes',
    'Tecnología', 'Negocios', 'Idiomas', 'Cultura General'
  ];
  
  categories = [
    'Educación', 'Certificación', 'Evaluación', 'Práctica',
    'Entrenamiento', 'Examen', 'Quiz', 'Test Rápido'
  ];
  
  levels = ['Principiante', 'Intermedio', 'Avanzado'];
  questionOptions = [10, 20, 30, 40, 50];
  answerOptions = [3, 4];
  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' }
  ];

  constructor(
    private fb: FormBuilder,
    private aiTestService: AITestService,
    private router: Router
  ) {
    this.generateForm = this.fb.group({
      topic: ['', Validators.required],
      category: ['Educación', Validators.required],
      level: ['Principiante', Validators.required],
      num_questions: [10, [Validators.required, Validators.min(10), Validators.max(50)]],
      num_answers: [4, [Validators.required, Validators.min(3), Validators.max(4)]],
      language: ['es', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUserQuota();
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  loadUserQuota() {
    this.quotaLoading.set(true);
    this.aiTestService.getUserQuota().subscribe({
      next: (quota) => {
        this.quota.set(quota);
        this.quotaLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar quota:', err);
        this.quotaLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.generateForm.invalid) {
      Object.keys(this.generateForm.controls).forEach(key => {
        const control = this.generateForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Verificar quota
    const quota = this.quota();
    if (quota && quota.remaining_requests <= 0) {
      this.error.set('Has alcanzado el límite de tests generados para este mes.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request: GenerateTestRequest = this.generateForm.value;

    this.aiTestService.generateTest(request).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.requestId.set(response.request_id);
        this.generating.set(true);
        
        // Iniciar polling para verificar estado
        this.startPollingStatus(response.request_id);
        
        // Actualizar quota localmente
        if (quota) {
          quota.used_requests++;
          quota.remaining_requests--;
          this.quota.set({...quota});
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        if (err.error?.code === 'QUOTA_EXCEEDED') {
          this.error.set('Has alcanzado el límite de tests generados para este mes.');
        } else {
          this.error.set(err.error?.error || 'Error al generar el test');
        }
      }
    });
  }

  startPollingStatus(requestId: number) {
    this.checkInterval = setInterval(() => {
      this.aiTestService.getRequestStatus(requestId).subscribe({
        next: (status: any) => {
          if (status.status === 'completed') {
            clearInterval(this.checkInterval);
            this.generating.set(false);
            
            // Redirigir al test generado
            if (status.generated_test_id) {
              setTimeout(() => {
                this.router.navigate(['/tests', status.generated_test_id, 'single']);
              }, 2000);
            }
          } else if (status.status === 'failed') {
            clearInterval(this.checkInterval);
            this.generating.set(false);
            this.error.set(status.error_message || 'Error al generar el test');
          }
        },
        error: (err: any) => {
          console.error('Error al verificar estado:', err);
        }
      });
    }, 3000); // Verificar cada 3 segundos
  }

  cancelGeneration() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.generating.set(false);
    this.requestId.set(null);
  }
}