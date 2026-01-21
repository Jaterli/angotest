import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AITestService } from '../../services/generate-test.service';
import { TopicsService } from '../../../shared/services/topics.service';
import { GenerateTestRequest, UserQuota } from '../../models/generate-test.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-generate-test',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-test.component.html'
})
export class GenerateTestComponent implements OnInit {

  /* ----------------------------- FORM ----------------------------- */

  generateForm: FormGroup;

  /* ---------------------------- SIGNALS ---------------------------- */

  loading = signal(false);
  error = signal<string | null>(null);
  quota = signal<UserQuota | null>(null);

  // Temas predefinidos
  mainTopics = signal<string[]>([]);
  subTopics = signal<string[]>([]);
  specificTopics = signal<string[]>([]);

  // Estados de carga
  isLoading = signal({
    main: false,
    sub: false,
    specific: false,
    quota: false
  });

  /* ------------------------- UI CONSTANTS -------------------------- */

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

  /* ---------------------------- RXJS ------------------------------- */

  private authService = inject(AuthService);
  userRole = this.authService.getUserRole();

  /* --------------------------- CONSTRUCTOR ------------------------- */

  constructor(
    private fb: FormBuilder,
    private aiTestService: AITestService,
    private topicsService: TopicsService,
    private router: Router
  ) {
    this.generateForm = this.fb.group({
      generation_mode: ['structured'],
      main_topic: ['', Validators.required],
      sub_topic: ['', Validators.required],
      specific_topic: ['', Validators.required],
      level: ['Principiante', Validators.required],
      num_questions: [10, [Validators.required, Validators.min(10), Validators.max(50)]],
      num_answers: [3, [Validators.required, Validators.min(3), Validators.max(4)]],
      language: ['es', Validators.required],
      ai_prompt: ['']
    });
  }

  /* ---------------------------- LIFECYCLE -------------------------- */

  ngOnInit(): void {
    this.initUserRole();
    this.loadUserQuota();
    this.loadMainTopics();
    this.setupFormLogic();
  }

  /* ----------------------------- INIT ------------------------------ */

  private initUserRole(): void {
    if (this.userRole !== 'admin') {
      this.generateForm.get('generation_mode')?.setValue('structured');
      // Para usuarios no admin, deshabilitar modo prompt
      this.generateForm.get('generation_mode')?.disable();
    }

    this.updateValidators(this.generateForm.value.generation_mode);
  }

  private setupFormLogic(): void {
    this.generateForm.get('generation_mode')?.valueChanges.subscribe(mode => {
      this.updateValidators(mode);
    });

    this.generateForm.get('main_topic')?.valueChanges.subscribe(mainTopic => {
      if (mainTopic) {
        this.loadSubTopics(mainTopic);
      } else {
        this.resetSubTopics();
      }
    });

    this.generateForm.get('sub_topic')?.valueChanges.subscribe(subTopic => {
      const mainTopic = this.generateForm.get('main_topic')?.value;
      if (mainTopic && subTopic) {
        this.loadSpecificTopics(mainTopic, subTopic);
      } else {
        this.resetSpecificTopics();
      }
    });
  }

  /* -------------------------- VALIDATION ---------------------------- */

  private updateValidators(mode: 'structured' | 'prompt'): void {
    const main = this.generateForm.get('main_topic');
    const sub = this.generateForm.get('sub_topic');
    const specific = this.generateForm.get('specific_topic');
    const prompt = this.generateForm.get('ai_prompt');

    if (mode === 'structured') {
      main?.setValidators(Validators.required);
      sub?.setValidators(Validators.required);
      specific?.setValidators(Validators.required);
      prompt?.clearValidators();
      
      // Habilitar selects de temas
      main?.enable();
      sub?.enable();
      specific?.enable();
      prompt?.disable();
    } else {
      main?.clearValidators();
      sub?.clearValidators();
      specific?.clearValidators();
      prompt?.setValidators([Validators.required, Validators.minLength(10)]);
      
      // Deshabilitar selects de temas
      main?.disable();
      sub?.disable();
      specific?.disable();
      prompt?.enable();
      
      // Resetear valores
      this.generateForm.patchValue({
        main_topic: '',
        sub_topic: '',
        specific_topic: ''
      });
    }

    [main, sub, specific, prompt].forEach(c => c?.updateValueAndValidity());
  }

  /* ---------------------------- LOADERS ----------------------------- */

  private loadMainTopics(): void {
    this.isLoading.update(state => ({ ...state, main: true }));
    this.topicsService.getMainTopics().subscribe({
      next: (topics) => {
        this.mainTopics.set(topics);
        this.isLoading.update(state => ({ ...state, main: false }));
      },
      error: (err) => {
        console.error('Error al cargar temas principales:', err);
        // Fallback a temas predefinidos
        const fallbackTopics = [
          'Ciencias de la Computación',
          'Matemáticas',
          'Historia',
          'Ciencias Naturales',
          'Literatura',
          'Idiomas (Inglés)',
          'Idiomas (Francés)',
          'Derecho',
          'Economía',
          'Cultura General',
          'Deportes'
        ];
        this.mainTopics.set(fallbackTopics);
        this.isLoading.update(state => ({ ...state, main: false }));
      }
    });
  }

  private loadSubTopics(mainTopic: string) {
    this.isLoading.update(state => ({ ...state, sub: true }));
    this.topicsService.getSubtopics(mainTopic).subscribe({
      next: (topics) => {
        this.subTopics.set(topics);
        this.isLoading.update(state => ({ ...state, sub: false }));
        
        // Resetear subtema y tema específico
        this.generateForm.patchValue({
          sub_topic: '',
          specific_topic: ''
        });
        this.specificTopics.set([]);
      },
      error: (err) => {
        console.error('Error al cargar subtemas:', err);
        this.subTopics.set([]);
        this.specificTopics.set([]);
        this.generateForm.patchValue({
          sub_topic: '',
          specific_topic: ''
        });
        this.isLoading.update(state => ({ ...state, sub: false }));
      }
    });
  }

  private loadSpecificTopics(mainTopic: string, subTopic: string) {
    this.isLoading.update(state => ({ ...state, specific: true }));
    this.topicsService.getSpecificTopics(mainTopic, subTopic).subscribe({
      next: (topics) => {
        this.specificTopics.set(topics);
        this.isLoading.update(state => ({ ...state, specific: false }));
        
        // Resetear tema específico
        this.generateForm.patchValue({
          specific_topic: topics.length > 0 ? topics[0] : ''
        });
      },
      error: (err) => {
        console.error('Error al cargar temas específicos:', err);
        this.specificTopics.set([]);
        this.generateForm.patchValue({
          specific_topic: ''
        });
        this.isLoading.update(state => ({ ...state, specific: false }));
      }
    });
  }

  private loadUserQuota(): void {
    this.isLoading.update(state => ({ ...state, quota: true }));
    this.aiTestService.getUserQuota().subscribe({
      next: quota => {
        this.quota.set(quota);
        this.isLoading.update(state => ({ ...state, quota: false }));
      },
      error: () => {
        this.isLoading.update(state => ({ ...state, quota: false }));
      }
    });
  }

  /* ----------------------------- SUBMIT ----------------------------- */

  onSubmit(): void {
    if (this.generateForm.invalid) {
      this.generateForm.markAllAsTouched();
      return;
    }

    const quota = this.quota();
    if (quota && quota.remaining_requests <= 0) {
      this.error.set('Has alcanzado el límite mensual.');
      return;
    }

    const payload: GenerateTestRequest = { 
      ...this.generateForm.getRawValue() 
    };

    if (this.userRole !== 'admin') {
      delete payload.generation_mode;
      delete payload.ai_prompt;
    }

    if (payload.generation_mode === 'prompt') {
      delete payload.main_topic;
      delete payload.sub_topic;
      delete payload.specific_topic;
    }

    this.loading.set(true);
    this.error.set(null);

    this.aiTestService.generateTest(payload).subscribe({
      next: res => {
        this.loading.set(false);

        if (res.status === 'completed') {
          if (this.userRole != 'admin') {
            this.router.navigate(['/tests', res.generated_test_id, 'start-single']);
          } else {
            this.router.navigate(['/admin/tests']);
          }
        }

        if (res.status === 'failed') {
          this.error.set(res.error_message || 'Error al generar el test');
        }
        
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al generar el test');
      }
    });
  }

  cancelGeneration(): void {
    this.error.set(null);
    this.loading.set(false);
  }

  /* ---------------------------- HELPERS ----------------------------- */

  private resetSubTopics(): void {
    this.subTopics.set([]);
    this.specificTopics.set([]);
    this.generateForm.patchValue({ 
      sub_topic: '', 
      specific_topic: '' 
    });
  }

  private resetSpecificTopics(): void {
    this.specificTopics.set([]);
    this.generateForm.patchValue({ 
      specific_topic: '' 
    });
  }

  resetForm(): void {
    if (confirm('Se perderán todos los datos ingresados. ¿Estás seguro?')) {
      this.generateForm.reset({
        generation_mode: 'structured',
        main_topic: '',
        sub_topic: '',
        specific_topic: '',
        level: 'Principiante',
        num_questions: 10,
        num_answers: 3,
        language: 'es',
        ai_prompt: ''
      });
      this.subTopics.set([]);
      this.specificTopics.set([]);
      this.error.set(null);
      
      // Re-habilitar controles según el modo
      if (this.userRole === 'admin') {
        this.generateForm.get('generation_mode')?.enable();
      }
    }
  }
}