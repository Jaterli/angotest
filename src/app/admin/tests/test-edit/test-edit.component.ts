import { Component, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';
import { Test } from '../../../shared/models/test.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';
import { TopicsService } from '../../../shared/services/topics.service';

@Component({
  selector: 'app-test-edit',
  standalone: true,
  templateUrl: './test-edit.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
  ]
})
export class TestEditComponent implements OnInit, OnDestroy {
  testForm: FormGroup;
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  testId!: number;
  testData: Test | null = null;

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

    this.isValidSpecificTopic(); // Dependencia necesaria para cambiar el mensaje de Tema Específico

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

  // Estados para modales
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showTopicWarningModal = signal(false);
  errorMessage = signal('');
  invalidTopics = signal<string[]>([]);

  // Suscripciones
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private testsManagementService: TestsManagementService,
    private topicsService: TopicsService,
    private route: ActivatedRoute,
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

    this.setupTopicListeners();
  }

  ngOnInit() {
    this.loadMainTopics();
    this.route.params.subscribe(params => {
      this.testId = +params['id'];
      if (this.testId) {
        this.loadTest();
      } else {
        this.error.set('ID de test inválido');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
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
          const subTopic = this.testForm.get('sub_topic')?.value;
          if (subTopic != '') this.loadSpecificTopics(value, subTopic);

           
        } else {
          this.subTopics.set([]);
          this.specificTopics.set([]);
          //this.testForm.get('sub_topic')?.setValue('', { emitEvent: false });
          //this.testForm.get('specific_topic')?.setValue('', { emitEvent: false });
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
          //this.testForm.get('specific_topic')?.setValue('', { emitEvent: false });
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
        // Solo mantener el listener para cerrar la lista si se muestra
      }) || new Subscription()
    );
  }


    // this.subscriptions.add(
    //   this.testForm.get('specific_topic')?.valueChanges.pipe(
    //     debounceTime(200),
    //     distinctUntilChanged(),
    //     tap(() => this.showLists.specific = false),
    //     filter(value => {
    //       const mainTopic = this.testForm.get('main_topic')?.value;
    //       const subTopic = this.testForm.get('sub_topic')?.value;
    //       return value && value.trim() && mainTopic && mainTopic.trim() && subTopic && subTopic.trim();
    //     })
    //   ).subscribe(value => {
    //     const isValid = this.specificTopics().some(t => t.toLowerCase() === value.toLowerCase());
    //     console.log("Validando specific: ", isValid);
    //     // if (!isValid && this.specificTopics().length > 0) {
    //     //   const suggestions = this.findSimilarTopics(value, this.specificTopics());
    //     //   this.topicSuggestions.update(s => ({ ...s, specific_topics: suggestions }));
    //     // }
    //   }) || new Subscription()
    // );




  loadMainTopics() {
    this.isLoading.update(state => ({ ...state, main: true }));
    this.topicsService.getMainTopics().subscribe({
      next: (topics) => {
        this.mainTopics.set(topics);
        this.isLoading.update(state => ({ ...state, main: false }));
      },
      error: (err) => {
        console.error('Error al cargar temas principales:', err);
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

  loadTest() {
    this.loading.set(true);
    this.error.set(null);
    
    this.testsManagementService.getTestById(this.testId).subscribe({
      next: (response: any) => {
        try {
          const testData = response.test || response;
          
          if (!testData) {
            throw new Error('No se recibieron datos del test');
          }
          
          if (!testData.questions) {
            testData.questions = [];
          }
          
          this.testData = testData;
          this.populateForm(testData);
          this.loading.set(false);
          
        } catch (err: any) {
          console.error('Error procesando la respuesta:', err);
          this.error.set('Error al procesar los datos del test');
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error al cargar el test:', err);
        this.error.set(`Error al cargar el test: ${err.message || 'Error desconocido'}`);
        this.loading.set(false);
      }
    });
  }

  populateForm(test: Test) {
    // Limpiar formulario
    while (this.questions.length !== 0) {
      this.questions.removeAt(0);
    }

    // Establecer valores
    this.testForm.patchValue({
      title: test.title || '',
      description: test.description || '',
      main_topic: test.main_topic || '',
      sub_topic: test.sub_topic || '',
      specific_topic: test.specific_topic || '',
      level: test.level || '',
      is_active: test.is_active !== undefined ? test.is_active : true      
    });

    // Cargar datos relacionados
    if (test.main_topic) {
      setTimeout(() => {
        if (this.mainTopics().some(t => t.toLowerCase() === test.main_topic.toLowerCase())) {
          this.loadSubTopics(test.main_topic);
        }
      }, 100);
    }

    if (test.sub_topic) {
      setTimeout(() => {
        if (this.subTopics().some(t => t.toLowerCase() === test.sub_topic.toLowerCase())) {
          this.loadSpecificTopics(test.main_topic, test.sub_topic);
        }
      }, 500);
    }

    // Cargar preguntas
    if (test.questions && test.questions.length > 0) {
      test.questions.forEach(question => {
        this.addQuestionWithData(question);
      });
    }
  }

  addQuestionWithData(question: any) {
    const questionGroup = this.fb.group({
      id: [question.id || null],
      question_text: [question.question_text || '', Validators.required],
      answers: this.fb.array([])
    });

    this.questions.push(questionGroup);
    const answersArray = questionGroup.get('answers') as FormArray;
    
    if (question.answers && question.answers.length > 0) {
      question.answers.forEach((answer: any) => {
        answersArray.push(this.fb.group({
          id: [answer.id || null],
          answer_text: [answer.answer_text || '', Validators.required],
          is_correct: [answer.is_correct || false]
        }));
      });
    } else {
      for (let i = 0; i < 4; i++) {
        answersArray.push(this.fb.group({
          id: [null],
          answer_text: ['', Validators.required],
          is_correct: [i === 0]
        }));
      }
    }
  }

  get questions(): FormArray {
    return this.testForm.get('questions') as FormArray;
  }

  addQuestion() {
    this.questions.push(this.fb.group({
      id: [null],
      question_text: ['', Validators.required],
      answers: this.fb.array([
        this.fb.group({ id: [null], answer_text: ['', Validators.required], is_correct: [true] }),
        this.fb.group({ id: [null], answer_text: ['', Validators.required], is_correct: [false] }),
        this.fb.group({ id: [null], answer_text: ['', Validators.required], is_correct: [false] }),
      ])
    }));

    const lastQuestion = document.querySelector('#cuestions > div:last-child');
    if (lastQuestion)
      lastQuestion.scrollIntoView();
  }

  getAnswers(qIndex: number): FormArray {
    return this.questions.at(qIndex).get('answers') as FormArray;
  }

  addAnswer(qIndex: number) {
    this.getAnswers(qIndex).push(this.fb.group({ 
      id: [null], 
      answer_text: ['', Validators.required], 
      is_correct: [false] 
    }));
  }

  onCorrectAnswerChange(questionIndex: number, answerIndex: number): void {
    const answersArray = this.questions.at(questionIndex).get('answers') as FormArray;
    
    answersArray.controls.forEach((answerControl, index) => {
      answerControl.get('is_correct')?.setValue(index === answerIndex);
    });
  }

  hasCorrectAnswer(questionIndex: number): boolean {
    const answersArray = this.questions.at(questionIndex).get('answers') as FormArray;
    return answersArray.controls.some(answerControl => answerControl.get('is_correct')?.value);
  }

  allQuestionsHaveCorrectAnswer(): boolean {
    return this.questions.controls.every((_, index) => this.hasCorrectAnswer(index));
  }

  validateForm(): boolean {
    if (this.testForm.invalid) {
      this.markFormGroupTouched(this.testForm);
      return false;
    }
    
    const mainTopic = this.testForm.get('main_topic')?.value;
    const subTopic = this.testForm.get('sub_topic')?.value;
    const specificTopic = this.testForm.get('specific_topic')?.value;
    
    if (!mainTopic || !subTopic || !specificTopic) {
      this.showError('Debe completar todos los campos de la jerarquía de temas.');
      return false;
    }
    
    const validation = this.validationState();
    const hasInvalidTopics = !validation.main.isValid || !validation.sub.isValid || !validation.specific.isValid;
    
    if (hasInvalidTopics) {
      this.showTopicWarning();
      return true;
    }
    
    return this.validateQuestions();
  }

  validateQuestions(): boolean {
    const questions = this.questions.value;
    if (questions.length === 0) {
      this.showError('Debe haber al menos una pregunta en el test.');
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.answers.some((a: any) => a.is_correct)) {
        this.showError(`La pregunta "${question.question_text}" debe tener una respuesta correcta seleccionada.`);
        return false;
      }
      
      if (question.answers.length < 2) {
        this.showError(`La pregunta "${question.question_text}" debe tener al menos dos respuestas.`);
        return false;
      }
      
      const answerTexts = question.answers.map((a: any) => a.answer_text.toLowerCase().trim());
      const uniqueAnswers = new Set(answerTexts);
      if (uniqueAnswers.size !== answerTexts.length) {
        this.showError(`La pregunta "${question.question_text}" tiene respuestas duplicadas.`);
        return false;
      }
    }
    
    return true;
  }

  showTopicWarning() {
    const warnings: string[] = [];
    const validation = this.validationState();
    
    if (!validation.main.isValid) warnings.push('Tema principal');
    if (!validation.sub.isValid) warnings.push('Subtema');
    if (!validation.specific.isValid) warnings.push('Tema específico');
    
    this.invalidTopics.set(warnings);
    this.showTopicWarningModal.set(true);
  }

  onTopicWarningConfirm(proceed: boolean) {
    this.showTopicWarningModal.set(false);
    if (proceed) {
      this.submitForm();
    }
  }

  submit() {
    if (!this.validateForm()) return;
    
    const validation = this.validationState();
    const hasInvalidTopics = !validation.main.isValid || !validation.sub.isValid || !validation.specific.isValid;
    
    if (hasInvalidTopics) {
      // Ya se mostró la advertencia en validateForm()
    } else {
      this.submitForm();
    }
  }

  submitForm() {
    this.saving.set(true);
    
    const formData = this.prepareFormData();
    
    this.testsManagementService.updateTest(this.testId, formData).subscribe({
      next: (res: any) => {
        console.log('Test editado con éxito:', res);
        this.saving.set(false);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al editar test:', err);
        this.saving.set(false);
        this.errorMessage.set(this.getErrorMessage(err));
        this.showErrorModal.set(true);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private prepareFormData(): any {
    const formValue = this.testForm.value;
    
    const filteredQuestions = formValue.questions
      .filter((q: any) => q.question_text.trim())
      .map((question: any) => ({
        id: question.id || undefined,
        question_text: question.question_text.trim(),
        answers: question.answers
          .filter((a: any) => a.answer_text.trim())
          .map((answer: any) => ({
            id: answer.id || undefined,
            answer_text: answer.answer_text.trim(),
            is_correct: answer.is_correct
          }))
      }))
      .filter((q: any) => q.answers.length >= 2);

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

  private getErrorMessage(err: any): string {
    if (err.error?.error) {
      return err.error.error;
    }
    
    if (err.status === 404) {
      return 'Test no encontrado.';
    }
    
    if (err.status === 401) {
      return 'No tienes permisos para editar este test.';
    }
    
    if (err.status === 400) {
      return 'Datos inválidos enviados.';
    }
    
    if (err.status === 500) {
      return 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    return 'Error desconocido al actualizar el test.';
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.showErrorModal.set(true);
  }

  onSuccessModalConfirm() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/admin/tests']);
  }

  onErrorModalConfirm() {
    this.showErrorModal.set(false);
  }

  cancel() {
    if (confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/admin/tests']);
    }
  }

  deleteQuestion(index: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      this.questions.removeAt(index);
    }
  }

  deleteAnswer(qIndex: number, aIndex: number) {
    if (this.getAnswers(qIndex).length <= 2) {
      alert('Debe haber al menos dos respuestas por pregunta.');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) {
      this.getAnswers(qIndex).removeAt(aIndex);
    }
  }

  reload() {
    this.loadTest();
  }
}