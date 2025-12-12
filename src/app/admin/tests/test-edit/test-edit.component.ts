import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Test } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';

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
export class TestEditComponent implements OnInit {
  testForm: FormGroup;
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  testId!: number;
  testData: Test | null = null;

  // Estados para modales
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private testService: TestService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.testForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      test_date: ['', Validators.required],
      category: ['', Validators.required],
      level: ['', Validators.required],
      questions: this.fb.array([])
    });
  }

  ngOnInit() {
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

  loadTest() {
    this.loading.set(true);
    this.error.set(null);
    
    this.testService.getTestById(this.testId).subscribe({
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
    while (this.questions.length !== 0) {
      this.questions.removeAt(0);
    }

    const formattedDate = test.test_date ? 
      test.test_date.split('T')[0] : 
      new Date().toISOString().split('T')[0];

    this.testForm.patchValue({
      title: test.title || '',
      description: test.description || '',
      test_date: formattedDate,
      category: test.category || '',
      level: test.level || ''
    });

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
      answersArray.push(this.fb.group({
        id: [null],
        answer_text: ['', Validators.required],
        is_correct: [false]
      }));
      answersArray.push(this.fb.group({
        id: [null],
        answer_text: ['', Validators.required],
        is_correct: [false]
      }));
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
        this.fb.group({ id: [null], answer_text: ['', Validators.required], is_correct: [false] }),
        this.fb.group({ id: [null], answer_text: ['', Validators.required], is_correct: [false] })
      ])
    }));
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

  validateForm(): boolean {
    if (this.testForm.invalid) {
      this.markFormGroupTouched(this.testForm);
      return false;
    }
    
    const questions = this.questions.value;
    if (questions.length === 0) {
      this.showError('Debe haber al menos una pregunta en el test.');
      return false;
    }
    
    for (const question of questions) {
      const hasCorrectAnswer = question.answers.some((answer: any) => answer.is_correct);
      if (!hasCorrectAnswer) {
        this.showError(`La pregunta "${question.question_text}" debe tener al menos una respuesta correcta.`);
        return false;
      }
    }
    
    return true;
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  submit() {
    if (!this.validateForm()) return;

    this.saving.set(true);
    const formData = this.testForm.value;
    
    // Preparar datos para enviar
    const testData = {
      ...formData,
      id: this.testId
    };

    this.testService.updateTest(this.testId, testData).subscribe({
      next: (res: any) => {
        console.log('Test editado con éxito:', res);
        this.saving.set(false);
        
        // Mostrar modal de éxito
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al editar test:', err);
        this.saving.set(false);
        
        // Mostrar modal de error
        this.errorMessage.set(this.getErrorMessage(err));
        this.showErrorModal.set(true);
      }
    });
  }

  // Método para obtener mensaje de error legible
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

  // Método para mostrar error sin modal
  private showError(message: string) {
    this.errorMessage.set(message);
    this.showErrorModal.set(true);
  }

  // Manejar confirmación del modal de éxito
  onSuccessModalConfirm() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/admin/tests']);
  }

  // Manejar confirmación del modal de error
  onErrorModalConfirm() {
    this.showErrorModal.set(false);
  }

  cancel() {
    this.showErrorModal.set(false);
    
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