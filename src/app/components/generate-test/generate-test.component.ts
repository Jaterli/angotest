import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../modal.component';
import { GenerateTestRequest, TopicsResponse, UserQuota } from '../../models/generate-test.model';
import { AITestService } from '../../services/generate-test.service';
import { debounceTime, distinctUntilChanged, switchMap, Subject, of } from 'rxjs';

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
  subTopicsLoading = signal(false);
  specificTopicsLoading = signal(false);
  error = signal<string | null>(null);
  
  quota = signal<UserQuota | null>(null);
  requestId = signal<number | null>(null);
  checkInterval: any;
  
  // Temas principales
  mainTopics = signal<string[]>([]);
  subTopics = signal<string[]>([]);
  specificTopics = signal<string[]>([]);
  
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

  // Instrucciones adicionales para IA (solo visible para admin)
  showAIPrompt = false;
  userRole = 'admin'; // Esto debería venir del servicio de autenticación

  // Subjects para debounce
  private mainTopicChangeSubject = new Subject<string>();
  private subTopicChangeSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private aiTestService: AITestService,
    private router: Router
  ) {
    this.generateForm = this.fb.group({
      main_topic: ['', Validators.required],
      sub_topic: ['', Validators.required],
      specific_topic: ['', Validators.required],
      level: ['Principiante', Validators.required],
      num_questions: [10, [Validators.required, Validators.min(10), Validators.max(50)]],
      num_answers: [4, [Validators.required, Validators.min(3), Validators.max(4)]],
      language: ['es', Validators.required],
      ai_prompt: [''] // Campo opcional para admin
    });
  }

  ngOnInit() {
    this.loadUserQuota();
    this.loadMainTopics();
    
    // Obtener rol del usuario (simulado)
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.userRole = user.role || 'user';
      this.showAIPrompt = this.userRole === 'admin';
    }
    
    // Suscribirse a cambios en el tema principal
    this.generateForm.get('main_topic')?.valueChanges.subscribe(mainTopic => {
      if (mainTopic) {
        this.mainTopicChangeSubject.next(mainTopic);
      } else {
        this.subTopics.set([]);
        this.specificTopics.set([]);
        this.generateForm.get('sub_topic')?.setValue('');
        this.generateForm.get('specific_topic')?.setValue('');
      }
    });
    
    // Suscribirse a cambios en el subtema
    this.generateForm.get('sub_topic')?.valueChanges.subscribe(subTopic => {
      const mainTopic = this.generateForm.get('main_topic')?.value;
      if (mainTopic && subTopic) {
        this.subTopicChangeSubject.next(subTopic);
      } else {
        this.specificTopics.set([]);
        this.generateForm.get('specific_topic')?.setValue('');
      }
    });
    
    // Configurar debounce para tema principal
    this.mainTopicChangeSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(mainTopic => {
        this.subTopicsLoading.set(true);
        this.generateForm.get('sub_topic')?.setValue('');
        this.generateForm.get('specific_topic')?.setValue('');
        return this.aiTestService.getSubTopics(mainTopic);
      })
    ).subscribe({
      next: (response) => {
        this.subTopics.set(response.sub_topics);
        this.subTopicsLoading.set(false);
        
        if (response.sub_topics.length > 0) {
          setTimeout(() => {
            this.generateForm.get('sub_topic')?.setValue(response.sub_topics[0]);
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar subtemas:', err);
        this.subTopics.set([]);
        this.subTopicsLoading.set(false);
      }
    });
    
    // Configurar debounce para subtema
    this.subTopicChangeSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(subTopic => {
        const mainTopic = this.generateForm.get('main_topic')?.value;
        this.specificTopicsLoading.set(true);
        this.generateForm.get('specific_topic')?.setValue('');
        return this.aiTestService.getSpecificTopics(mainTopic, subTopic);
      })
    ).subscribe({
      next: (response) => {
        this.specificTopics.set(response.specific_topics);
        this.specificTopicsLoading.set(false);
        
        if (response.specific_topics.length > 0) {
          setTimeout(() => {
            this.generateForm.get('specific_topic')?.setValue(response.specific_topics[0]);
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar temas específicos:', err);
        this.specificTopics.set([]);
        this.specificTopicsLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.mainTopicChangeSubject.complete();
    this.subTopicChangeSubject.complete();
  }

  loadMainTopics() {
    this.topicsLoading.set(true);
    this.aiTestService.getMainTopics().subscribe({
      next: (response: any) => {
        this.mainTopics.set(response.main_topics);
        this.topicsLoading.set(false);
        
        if (response.main_topics.length > 0) {
          setTimeout(() => {
            const firstTopic = response.main_topics[0];
            this.generateForm.get('main_topic')?.setValue(firstTopic);
          });
        }
      },
      error: (err: any) => {
        console.error('Error al cargar temas principales:', err);
        // Fallback a temas predefinidos
        const fallbackTopics = [
          'Ciencias de la Computación', 'Matemáticas', 'Historia', 'Ciencias Naturales',
          'Literatura', 'Idiomas', 'Derecho', 'Economía',
          'Cultura General', 'Deportes'
        ];
        this.mainTopics.set(fallbackTopics);
        this.topicsLoading.set(false);
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

    // Si no es admin, eliminar el campo ai_prompt
    if (this.userRole !== 'admin') {
      delete request.ai_prompt;
    }

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
        } else if (err.error?.valid_main_topics) {
          this.error.set('La combinación de temas seleccionada no es válida.');
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

  toggleAIPrompt() {
    this.showAIPrompt = !this.showAIPrompt;
    if (!this.showAIPrompt) {
      this.generateForm.get('ai_prompt')?.setValue('');
    }
  }
}