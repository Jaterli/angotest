import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../modal.component';
import { GenerateTestRequest, TopicsResponse, UserQuota } from '../../models/generate-test.model';
import { AITestService } from '../../services/generate-test.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-generate-test',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './generate-test.component.html'
})
export class GenerateTestComponent implements OnInit, OnDestroy {
  generateForm: FormGroup;
  loading = signal(false);
  quotaLoading = signal(false);
  topicsLoading = signal(false);
  generating = signal(false);
  categoriesLoading = signal(false);
  error = signal<string | null>(null);
  
  quota = signal<UserQuota | null>(null);
  requestId = signal<number | null>(null);
  checkInterval: any;
  
  // Temas obtenidos dinámicamente del backend
  topics = signal<string[]>([]);

   // Categorías dinámicas
  categories = signal<string[]>([]);
  
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

  // Subject para debounce de cambios en el tema
  private topicChangeSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private aiTestService: AITestService,
    private router: Router
  ) {
    this.generateForm = this.fb.group({
      topic: ['', Validators.required],
      category: ['', Validators.required],
      level: ['Principiante', Validators.required],
      num_questions: [10, [Validators.required, Validators.min(10), Validators.max(50)]],
      num_answers: [4, [Validators.required, Validators.min(3), Validators.max(4)]],
      language: ['es', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUserQuota();
    this.loadPredefinedTopics(); // Cargar temas del backend

    // Suscribirse a cambios en el tema para cargar categorías dinámicas
    this.generateForm.get('topic')?.valueChanges.subscribe(topic => {
      if (topic) {
        this.topicChangeSubject.next(topic);
      }
    });
    
    // Configurar debounce para evitar muchas llamadas API
    this.topicChangeSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(topic => {
        this.categoriesLoading.set(true);
        this.generateForm.get('category')?.setValue(''); // Resetear categoría
        return this.aiTestService.getCategoriesForTopic(topic);
      })
    ).subscribe({
      next: (response) => {
        this.categories.set(response.categories);
        this.categoriesLoading.set(false);
        
        // Seleccionar la primera categoría por defecto
        if (response.categories.length > 0) {
          setTimeout(() => {
            this.generateForm.get('category')?.setValue(response.categories[0]);
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.categories.set([]);
        this.categoriesLoading.set(false);
      }
    });
    
    // También cargar categorías si ya hay un tema seleccionado
    const initialTopic = this.generateForm.get('topic')?.value;
    if (initialTopic) {
      this.loadCategoriesForTopic(initialTopic);
    }
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.topicChangeSubject.complete();
  }


  loadPredefinedTopics() {
    this.topicsLoading.set(true);
    this.aiTestService.getPredefinedTopics().subscribe({
      next: (response: TopicsResponse) => {
        this.topics.set(response.topics);
        this.topicsLoading.set(false);
        
        // Seleccionar el primer tema por defecto si está disponible
        if (response.topics.length > 0) {
          setTimeout(() => {
            const firstTopic = response.topics[0];
            this.generateForm.get('topic')?.setValue(firstTopic);
            // Cargar categorías para el primer tema
            this.loadCategoriesForTopic(firstTopic);
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar temas:', err);
        // Fallback a temas locales si la API falla
        const fallbackTopics = [
          'Programación', 'Matemáticas', 'Historia', 'Ciencia',
          'Literatura', 'Geografía', 'Arte', 'Deportes',
          'Tecnología', 'Negocios', 'Idiomas', 'Cultura General'
        ];
        this.topics.set(fallbackTopics);
        this.topicsLoading.set(false);
      }
    });
  }


  loadCategoriesForTopic(topic: string) {
    this.categoriesLoading.set(true);
    this.aiTestService.getCategoriesForTopic(topic).subscribe({
      next: (response) => {
        this.categories.set(response.categories);
        this.categoriesLoading.set(false);
        
        // Si no hay categoría seleccionada, seleccionar la primera
        if (!this.generateForm.get('category')?.value && response.categories.length > 0) {
          this.generateForm.get('category')?.setValue(response.categories[0]);
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.categories.set([]);
        this.categoriesLoading.set(false);
      }
    });
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
        } else if (err.error?.valid_categories) {
          // Error de categoría inválida
          this.error.set(err.error.error);
          // Recargar categorías válidas
          this.loadCategoriesForTopic(this.generateForm.get('topic')?.value);
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
                this.router.navigate(['/tests', status.generated_test_id, 'start-single']);
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
    }, 3000);
  }

  cancelGeneration() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.generating.set(false);
    this.requestId.set(null);
  }
}