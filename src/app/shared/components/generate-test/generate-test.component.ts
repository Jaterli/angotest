import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, Subject } from 'rxjs';

import { AITestService } from '../../services/generate-test.service';
import {
  GenerateTestRequest,
  UserQuota
} from '../../../models/generate-test.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-generate-test',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-test.component.html'
})
export class GenerateTestComponent implements OnInit, OnDestroy {

  /* ----------------------------- FORM ----------------------------- */

  generateForm: FormGroup;

  /* ---------------------------- SIGNALS ---------------------------- */

  loading = signal(false);

  topicsLoading = signal(false);
  subTopicsLoading = signal(false);
  specificTopicsLoading = signal(false);
  quotaLoading = signal(false);

  error = signal<string | null>(null);

  quota = signal<UserQuota | null>(null);
  testId = signal<number | null>(null);

  mainTopics = signal<string[]>([]);
  subTopics = signal<string[]>([]);
  specificTopics = signal<string[]>([]);

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

  private mainTopicChange$ = new Subject<string>();
  private subTopicChange$ = new Subject<string>();
  private checkInterval?: number;
  private authService = inject(AuthService);
  userRole = this.authService.getUserRole()

  /* --------------------------- CONSTRUCTOR ------------------------- */

  constructor(
    private fb: FormBuilder,
    private aiTestService: AITestService,
    private router: Router
  ) {
    this.generateForm = this.fb.group({
      generation_mode: ['structured'], // admin only
      main_topic: [''],
      sub_topic: [''],
      specific_topic: [''],
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
    this.initFormLogic();
    this.initDebouncedRequests();
  }

  ngOnDestroy(): void {
    this.mainTopicChange$.complete();
    this.subTopicChange$.complete();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /* ----------------------------- INIT ------------------------------ */

  private initUserRole(): void {

    if (this.userRole !== 'admin') {
      this.generateForm.get('generation_mode')?.setValue('structured');
    }

    this.updateValidators(this.generateForm.value.generation_mode);
  }

  private initFormLogic(): void {
    this.generateForm.get('generation_mode')?.valueChanges.subscribe(mode => {
      this.updateValidators(mode);
    });

    this.generateForm.get('main_topic')?.valueChanges.subscribe(topic => {
      if (!topic) {
        this.resetSubTopics();
        return;
      }
      this.mainTopicChange$.next(topic);
    });

    this.generateForm.get('sub_topic')?.valueChanges.subscribe(sub => {
      if (!sub) {
        this.resetSpecificTopics();
        return;
      }
      this.subTopicChange$.next(sub);
    });
  }

  private initDebouncedRequests(): void {
    this.mainTopicChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(topic => {
          this.subTopicsLoading.set(true);
          this.resetSubTopics();
          return this.aiTestService.getSubTopics(topic);
        })
      )
      .subscribe({
        next: res => {
          this.subTopics.set(res.sub_topics || []);
          this.subTopicsLoading.set(false);
        },
        error: () => {
          this.subTopics.set([]);
          this.subTopicsLoading.set(false);
        }
      });

    this.subTopicChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(sub => {
          const main = this.generateForm.get('main_topic')?.value;
          this.specificTopicsLoading.set(true);
          this.resetSpecificTopics();
          return this.aiTestService.getSpecificTopics(main, sub);
        })
      )
      .subscribe({
        next: res => {
          this.specificTopics.set(res.specific_topics || []);
          this.specificTopicsLoading.set(false);
        },
        error: () => {
          this.specificTopics.set([]);
          this.specificTopicsLoading.set(false);
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
    } else {
      main?.clearValidators();
      sub?.clearValidators();
      specific?.clearValidators();
      prompt?.setValidators([Validators.required, Validators.minLength(10)]);
    }

    [main, sub, specific, prompt].forEach(c => c?.updateValueAndValidity());
  }

  /* ---------------------------- LOADERS ----------------------------- */

  private loadMainTopics(): void {
    this.topicsLoading.set(true);
    this.aiTestService.getMainTopics().subscribe({
      next: res => {
        this.mainTopics.set(res.main_topics || []);
        this.topicsLoading.set(false);
      },
      error: () => {
        this.mainTopics.set([
          'Ciencias de la Computación',
          'Matemáticas',
          'Historia',
          'Ciencias Naturales',
          'Literatura',
          'Idiomas',
          'Economía',
          'Cultura General'
        ]);
        this.topicsLoading.set(false);
      }
    });
  }

  private loadUserQuota(): void {
    this.quotaLoading.set(true);
    this.aiTestService.getUserQuota().subscribe({
      next: quota => {
        this.quota.set(quota);
        this.quotaLoading.set(false);
      },
      error: () => {
        this.quotaLoading.set(false);
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

    const payload: GenerateTestRequest = { ...this.generateForm.value };

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
          clearInterval(this.checkInterval);
          
          if (this.userRole != 'admin') {
            this.router.navigate(['/tests', res.generated_test_id, 'start-single']);
          } else {
            this.router.navigate(['/tests']);
          }
        }

        if (res.status === 'failed') {
          clearInterval(this.checkInterval);
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
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.testId.set(null);
  }

  /* ---------------------------- HELPERS ----------------------------- */

  private resetSubTopics(): void {
    this.subTopics.set([]);
    this.specificTopics.set([]);
    this.generateForm.patchValue({ sub_topic: '', specific_topic: '' });
  }

  private resetSpecificTopics(): void {
    this.specificTopics.set([]);
    this.generateForm.patchValue({ specific_topic: '' });
  }
}
