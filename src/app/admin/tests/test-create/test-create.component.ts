import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal.component';
import { debounceTime, distinctUntilChanged, switchMap, Subject, of } from 'rxjs';
import { AITestService } from '../../../shared/services/generate-test.service';
import { TestsManagementService } from '../../services/tests-management.service';

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
  
  // Señales para modales y estados
  loading = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showValidationModal = signal(false);
  showNoQuestionsModal = signal(false);
  
  // Mensajes de error
  errorMessage = signal('');
  validationMessage = signal('');
  
  // Estados de carga para temas
  topicsLoading = signal(true);
  subTopicsLoading = signal(false);
  specificTopicsLoading = signal(false);
  
  // Temas jerárquicos
  mainTopics = signal<string[]>([]);
  subTopics = signal<string[]>([]);
  specificTopics = signal<string[]>([]);
  
  // Opciones de nivel predefinidas
  levels = signal<string[]>(['Principiante', 'Intermedio', 'Avanzado']);

  // Subjects para debounce
  private mainTopicChangeSubject = new Subject<string>();
  private subTopicChangeSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder, 
    private testsManagementService: TestsManagementService,
    private authService: AuthService,
    private aiTestService: AITestService,
    private router: Router
  ) {
    this.testForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      main_topic: ['', Validators.required],
      sub_topic: ['', Validators.required],
      specific_topic: ['', Validators.required],
      level: ['', Validators.required],
      is_active: [true], // Nuevo campo
      questions: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Cargar temas principales desde el servicio
    this.loadMainTopics();
    
    // Configurar debounce para tema principal
    this.mainTopicChangeSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(mainTopic => {
        if (!mainTopic) {
          this.subTopics.set([]);
          this.specificTopics.set([]);
          this.testForm.get('sub_topic')?.setValue('');
          this.testForm.get('specific_topic')?.setValue('');
          return of({ sub_topics: [] });
        }
        
        this.subTopicsLoading.set(true);
        this.testForm.get('sub_topic')?.setValue('');
        this.testForm.get('specific_topic')?.setValue('');
        return this.aiTestService.getSubTopics(mainTopic);
      })
    ).subscribe({
      next: (response: any) => {
        this.subTopics.set(response.sub_topics || []);
        this.subTopicsLoading.set(false);
        
        if (response.sub_topics && response.sub_topics.length > 0) {
          setTimeout(() => {
            this.testForm.get('sub_topic')?.setValue(response.sub_topics[0]);
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
        const mainTopic = this.testForm.get('main_topic')?.value;
        if (!mainTopic || !subTopic) {
          this.specificTopics.set([]);
          this.testForm.get('specific_topic')?.setValue('');
          return of({ specific_topics: [] });
        }
        
        this.specificTopicsLoading.set(true);
        this.testForm.get('specific_topic')?.setValue('');
        return this.aiTestService.getSpecificTopics(mainTopic, subTopic);
      })
    ).subscribe({
      next: (response: any) => {
        this.specificTopics.set(response.specific_topics || []);
        this.specificTopicsLoading.set(false);
        
        if (response.specific_topics && response.specific_topics.length > 0) {
          setTimeout(() => {
            this.testForm.get('specific_topic')?.setValue(response.specific_topics[0]);
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar temas específicos:', err);
        this.specificTopics.set([]);
        this.specificTopicsLoading.set(false);
      }
    });
    
    // Escuchar cambios en main_topic
    this.testForm.get('main_topic')?.valueChanges.subscribe(mainTopic => {
      this.mainTopicChangeSubject.next(mainTopic);
    });
    
    // Escuchar cambios en sub_topic
    this.testForm.get('sub_topic')?.valueChanges.subscribe(subTopic => {
      this.subTopicChangeSubject.next(subTopic);
    });
  }

  ngOnDestroy(): void {
    this.mainTopicChangeSubject.complete();
    this.subTopicChangeSubject.complete();
  }

  loadMainTopics(): void {
    this.topicsLoading.set(true);
    
    this.aiTestService.getMainTopics().subscribe({
      next: (response: any) => {
        const topics = response.main_topics || response.hierarchy || [];
        this.mainTopics.set(Array.isArray(topics) ? topics : Object.keys(topics));
        this.topicsLoading.set(false);
        
        // Auto-seleccionar el primer tema si hay temas disponibles
        if (this.mainTopics().length > 0) {
          setTimeout(() => {
            const firstTopic = this.mainTopics()[0];
            this.testForm.get('main_topic')?.setValue(firstTopic);
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar temas principales:', err);
        // Fallback a temas predefinidos
        const fallbackTopics = [
          'Ciencias de la Computación', 'Matemáticas', 'Historia', 'Ciencias Naturales',
          'Literatura', 'Idiomas (Inglés)', 'Idiomas (Francés)', 'Derecho', 'Economía',
          'Cultura General', 'Deportes'
        ];
        this.mainTopics.set(fallbackTopics);
        this.topicsLoading.set(false);
        
        if (fallbackTopics.length > 0) {
          setTimeout(() => {
            this.testForm.get('main_topic')?.setValue(fallbackTopics[0]);
          });
        }
      }
    });
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
      answer_text: '', 
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
      is_active: formValue.is_active, // Incluir is_active
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
        created_at: '',
        main_topic: '',
        sub_topic: '',
        specific_topic: '',
        level: '',
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