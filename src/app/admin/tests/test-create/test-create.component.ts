import { Component, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';

import { AuthService } from '../../../shared/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';
import { TopicsService } from '../../../shared/services/topics.service';

@Component({
  selector: 'app-test-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './test-create.component.html'
})
export class TestCreateComponent implements OnInit, OnDestroy {
  testForm: FormGroup;
  loading = signal(false);
  
  // Estados para modales
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showValidationModal = signal(false);
  showNoQuestionsModal = signal(false);
  
  // Mensajes de error
  errorMessage = signal('');
  validationMessage = signal('');

  // Estados para temas
  mainTopics = signal<string[]>([]);
  subTopics = signal<string[]>([]);
  specificTopics = signal<string[]>([]);
  isValidSpecificTopic = signal<boolean>(true);
  
  // Estados de carga
  isLoading = signal({
    main: false,
    sub: false,
    specific: false
  });
  
  // Estados de validación
  validationState = computed(() => {
    const mainTopic = this.testForm.get('main_topic')?.value;
    const subTopic = this.testForm.get('sub_topic')?.value;
    const specificTopic = this.testForm.get('specific_topic')?.value;
    
    const mainValid = !mainTopic || this.mainTopics().some(t => t.toLowerCase() === mainTopic.toLowerCase());
    const subValid = !subTopic || this.subTopics().some(t => t.toLowerCase() === subTopic.toLowerCase());
    const specificValid = !specificTopic || this.specificTopics().some(t => t.toLowerCase() === specificTopic.toLowerCase());

    this.isValidSpecificTopic(); // Dependencia necesaria

    return {
      main: {
        isValid: mainValid,
        message: !mainTopic ? '' : 
                 mainValid ? '✓ Tema válido' : 'Tema no encontrado',
        hasData: this.mainTopics().length > 0
      },
      sub: {
        isValid: subValid,
        message: !subTopic ? '' : 
                 subValid ? '✓ Subtema válido' : 'Subtema no encontrado',
        hasData: this.subTopics().length > 0
      },
      specific: {
        isValid: specificValid,
        message: !specificTopic ? '' : 
                 specificValid ? '✓ Tema específico válido' : 'Tema específico no encontrado',
        hasData: this.specificTopics().length > 0
      }
    };
  });

  // UI states
  showLists = {
    main: false,
    sub: false,
    specific: false
  };

  // Opciones de nivel predefinidas
  levels = signal<string[]>(['Principiante', 'Intermedio', 'Avanzado']);

  // Suscripciones
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder, 
    private testsManagementService: TestsManagementService,
    private authService: AuthService,
    private topicsService: TopicsService,
    private router: Router
  ) {
    this.testForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      main_topic: ['', Validators.required],
      sub_topic: ['', Validators.required],
      specific_topic: ['', Validators.required],
      level: ['', Validators.required],
      is_active: [true],
      questions: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadMainTopics();
    this.setupTopicListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setupTopicListeners() {
    // 1. TEMA PRINCIPAL
    this.subscriptions.add(
      this.testForm.get('main_topic')?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => this.showLists.main = false),
        filter(value => value && value.trim().length > 0)
      ).subscribe(value => {
        const isValid = this.mainTopics().some(t => t.toLowerCase() === value.toLowerCase());
        
        if (isValid) {
          this.loadSubTopics(value);
        } else {
          this.subTopics.set([]);
          this.specificTopics.set([]);
          this.testForm.get('sub_topic')?.setValue('', { emitEvent: false });
          this.testForm.get('specific_topic')?.setValue('', { emitEvent: false });
        }
      }) || new Subscription()
    );

    // 2. SUBTEMA
    this.subscriptions.add(
      this.testForm.get('sub_topic')?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => this.showLists.sub = false),
        filter(value => {
          const mainTopic = this.testForm.get('main_topic')?.value;
          return value && value.trim() && mainTopic && mainTopic.trim();
        })
      ).subscribe(value => {
        const isValid = this.subTopics().some(t => t.toLowerCase() === value.toLowerCase());
        const mainTopic = this.testForm.get('main_topic')?.value;
        
        if (isValid && mainTopic) {
          this.loadSpecificTopics(mainTopic, value);
        } else {
          this.specificTopics.set([]);
          this.testForm.get('specific_topic')?.setValue('', { emitEvent: false });
        }
      }) || new Subscription()
    );

    // 3. TEMA ESPECÍFICO
    this.subscriptions.add(
      this.testForm.get('specific_topic')?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => this.showLists.specific = false),
        filter(value => {
          const mainTopic = this.testForm.get('main_topic')?.value;
          const subTopic = this.testForm.get('sub_topic')?.value;
          return value && value.trim() && mainTopic && mainTopic.trim() && subTopic && subTopic.trim();
        })
      ).subscribe(value => {
        const isValid = this.specificTopics().some(t => t.toLowerCase() === value.toLowerCase());
        if (!isValid && this.specificTopics().length > 0) {
          this.isValidSpecificTopic.set(false);
        } else {
          this.isValidSpecificTopic.set(true);
        }
      }) || new Subscription()
    );
  }

  loadMainTopics() {
    this.isLoading.update(state => ({ ...state, main: true }));
    this.topicsService.getMainTopics().subscribe({
      next: (topics) => {
        this.mainTopics.set(topics);
        this.isLoading.update(state => ({ ...state, main: false }));
      },
      error: (err) => {
        console.error('Error al cargar temas principales:', err);
        this.mainTopics.set([]);
        this.isLoading.update(state => ({ ...state, main: false }));
      }
    });
  }

  loadSubTopics(mainTopic: string) {
    this.isLoading.update(state => ({ ...state, sub: true }));
    this.topicsService.getSubtopics(mainTopic).subscribe({
      next: (topics) => {
        this.subTopics.set(topics);
        this.isLoading.update(state => ({ ...state, sub: false }));
      },
      error: (err) => {
        console.error('Error al cargar subtemas:', err);
        this.subTopics.set([]);
        this.isLoading.update(state => ({ ...state, sub: false }));
      }
    });
  }

  loadSpecificTopics(mainTopic: string, subTopic: string) {
    this.isLoading.update(state => ({ ...state, specific: true }));
    this.topicsService.getSpecificTopics(mainTopic, subTopic).subscribe({
      next: (topics) => {
        this.specificTopics.set(topics);
        this.isLoading.update(state => ({ ...state, specific: false }));
      },
      error: (err) => {
        console.error('Error al cargar temas específicos:', err);
        this.specificTopics.set([]);
        this.isLoading.update(state => ({ ...state, specific: false }));
      }
    });
  }

  onMainTopicSelect(topic: string) {
    this.testForm.get('main_topic')?.setValue(topic, { emitEvent: true });
    this.showLists.main = false;
  }

  onSubTopicSelect(topic: string) {
    this.testForm.get('sub_topic')?.setValue(topic, { emitEvent: true });
    this.showLists.sub = false;
  }

  onSpecificTopicSelect(topic: string) {
    this.testForm.get('specific_topic')?.setValue(topic, { emitEvent: true });
    this.showLists.specific = false;
  }

  get questions(): FormArray {
    return this.testForm.get('questions') as FormArray;
  }

  // Validar que haya al menos una respuesta correcta por pregunta
  validateForm(): boolean {
    if (this.testForm.invalid) {
      this.markFormGroupTouched(this.testForm);
      
      // Verificar si hay errores específicos de jerarquía
      const mainTopic = this.testForm.get('main_topic')?.value;
      const subTopic = this.testForm.get('sub_topic')?.value;
      const specificTopic = this.testForm.get('specific_topic')?.value;
      
      if (!mainTopic) {
        this.showValidationModalWithMessage('Por favor, selecciona un Tema Principal.');
        return false;
      }
      
      if (!subTopic) {
        this.showValidationModalWithMessage('Por favor, selecciona un Subtema.');
        return false;
      }
      
      if (!specificTopic) {
        this.showValidationModalWithMessage('Por favor, selecciona un Tema Específico.');
        return false;
      }
      
      return false;
    }
    
    if (this.questions.length === 0) {
      this.showNoQuestionsModal.set(true);
      return false;
    }
    
    const questions = this.questions.value;
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const hasCorrectAnswer = question.answers.some((answer: any) => answer.is_correct);
      if (!hasCorrectAnswer) {
        this.showValidationModalWithMessage(`La pregunta "${question.question_text}" debe tener al menos una respuesta correcta.`);
        return false;
      }
      
      // Validar que haya al menos 2 respuestas por pregunta
      if (question.answers.length < 2) {
        this.showValidationModalWithMessage(`La pregunta "${question.question_text}" debe tener al menos dos respuestas.`);
        return false;
      }
      
      // Validar que no haya respuestas duplicadas
      const answerTexts = question.answers.map((a: any) => a.answer_text.toLowerCase().trim());
      const uniqueAnswers = new Set(answerTexts);
      if (uniqueAnswers.size !== answerTexts.length) {
        this.showValidationModalWithMessage(`La pregunta "${question.question_text}" tiene respuestas duplicadas.`);
        return false;
      }
    }
    
    return true;
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Mostrar modal de validación con mensaje personalizado
  private showValidationModalWithMessage(message: string): void {
    this.validationMessage.set(message);
    this.showValidationModal.set(true);
  }
  
  addQuestion() {
    this.questions.push(this.fb.group({
      question_text: ['', Validators.required],
      answers: this.fb.array([
        this.fb.group({ answer_text: ['', Validators.required], is_correct: [true], id: null }),
        this.fb.group({ answer_text: ['', Validators.required], is_correct: [false], id: null }),
        this.fb.group({ answer_text: ['', Validators.required], is_correct: [false], id: null }),
      ])
    }));

    const lastQuestion = document.querySelector('#cuestions > div:last-child');
    if (lastQuestion)
      lastQuestion.scrollIntoView();
  }

  
  getAnswers(qIndex: number): FormArray {
    return this.questions.at(qIndex).get('answers') as FormArray;
  }

  addAnswer(qIndex: number): void {
    this.getAnswers(qIndex).push(this.fb.group({ 
      answer_text: ['', Validators.required], 
      is_correct: false,
      id: null 
    }));
  }

  // Eliminar pregunta con confirmación
  removeQuestion(index: number): void {
    if (this.questions.length <= 1) {
      this.showValidationModalWithMessage('El test debe tener al menos una pregunta.');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      this.questions.removeAt(index);
    }
  }

  // Eliminar respuesta con confirmación
  removeAnswer(questionIndex: number, answerIndex: number): void {
    if (this.getAnswers(questionIndex).length <= 2) {
      this.showValidationModalWithMessage('Cada pregunta debe tener al menos dos respuestas.');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) {
      this.getAnswers(questionIndex).removeAt(answerIndex);
    }
  }

  prepareFormData(): any {
    const formValue = this.testForm.value;
    
    // Filtrar preguntas y respuestas con datos válidos
    const filteredQuestions = formValue.questions
      .filter((q: any) => q.question_text && q.question_text.trim())
      .map((question: any) => ({
        question_text: question.question_text.trim(),
        answers: (question.answers || [])
          .filter((a: any) => a.answer_text && a.answer_text.trim())
          .map((answer: any) => ({
            answer_text: answer.answer_text.trim(),
            is_correct: answer.is_correct || false
          }))
      }))
      .filter((q: any) => q.answers.length >= 2); // Solo preguntas con al menos 2 respuestas

    return {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || '',
      main_topic: formValue.main_topic,
      sub_topic: formValue.sub_topic,
      specific_topic: formValue.specific_topic,
      level: formValue.level,
      is_active: formValue.is_active,
      questions: filteredQuestions
    };
  }

  submit(): void {
    if (!this.validateForm()) return;

    this.loading.set(true);
    
    // Obtener usuario autenticado
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.errorMessage.set('Usuario no autenticado');
      this.showErrorModal.set(true);
      this.loading.set(false);
      return;
    }

    // Preparar datos del test
    const testData = this.prepareFormData();

    // Verificar que haya al menos una pregunta
    if (!testData.questions || testData.questions.length === 0) {
      this.errorMessage.set('El test debe tener al menos una pregunta con respuestas válidas.');
      this.showErrorModal.set(true);
      this.loading.set(false);
      return;
    }

    this.testsManagementService.createTest(testData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(err));
        this.showErrorModal.set(true);
        console.error('Error creating test:', err);
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.error?.error) {
      return err.error.error;
    }
    
    if (err.status === 400) {
      return 'Datos inválidos enviados. Por favor, verifica la información.';
    }
    
    if (err.status === 401) {
      return 'No tienes permisos para crear tests.';
    }
    
    if (err.status === 500) {
      return 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    return 'Error al crear el test. Por favor, inténtalo de nuevo.';
  }

  // Manejar confirmación del modal de éxito
  onSuccessModalConfirm(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/admin/tests']);
  }

  // Manejar confirmación del modal de error
  onErrorModalConfirm(): void {
    this.showErrorModal.set(false);
  }

  // Manejar confirmación del modal de validación
  onValidationModalConfirm(): void {
    this.showValidationModal.set(false);
  }

  // Manejar confirmación del modal sin preguntas
  onNoQuestionsModalConfirm(): void {
    this.showNoQuestionsModal.set(false);
    this.addQuestion(); // Agregar una pregunta automáticamente
  }

  // Cancelar y volver a la lista
  cancel(): void {
    if (this.testForm.dirty) {
      if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
        this.router.navigate(['/admin/tests']);
      }
    } else {
      this.router.navigate(['/admin/tests']);
    }
  }

  // Manejar cambio de respuesta correcta (selección única)
  onCorrectAnswerChange(questionIndex: number, answerIndex: number): void {
    const answersArray = this.questions.at(questionIndex).get('answers') as FormArray;
    
    // Desmarcar todas las respuestas de esta pregunta
    answersArray.controls.forEach((answerControl, index) => {
      answerControl.get('is_correct')?.setValue(index === answerIndex);
    });
  }

  // Verificar si una pregunta tiene respuesta correcta
  hasCorrectAnswer(questionIndex: number): boolean {
    const answersArray = this.questions.at(questionIndex).get('answers') as FormArray;
    return answersArray.controls.some(answerControl => answerControl.get('is_correct')?.value);
  }

  // Verificar que todas las preguntas tengan respuesta correcta
  allQuestionsHaveCorrectAnswer(): boolean {
    return this.questions.controls.every((_, index) => this.hasCorrectAnswer(index));
  }
 
  // Reiniciar formulario
  resetForm(): void {
    if (confirm('Se perderán todos los datos ingresados. ¿Estás seguro?')) {
      this.testForm.reset({
        title: '',
        description: '',
        main_topic: '',
        sub_topic: '',
        specific_topic: '',
        level: '',
        is_active: true,
        questions: []
      });
      while (this.questions.length !== 0) {
        this.questions.removeAt(0);
      }
      this.subTopics.set([]);
      this.specificTopics.set([]);
    }
  }
}