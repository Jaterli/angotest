import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../../components/modal.component';
import { TestService } from '../../../core/services/test.service';
import { AuthService } from '../../../services/auth.service';

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
export class TestCreateComponent {
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
  
  // Información para modales
  modalTitle = signal('');
  modalMessage = signal('');
  modalIcon = signal<'success' | 'error' | 'warning' | 'info' | null>(null);

  constructor(
    private fb: FormBuilder, 
    private testService: TestService,
    private authService: AuthService,
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

  get questions(): FormArray {
    return this.testForm.get('questions') as FormArray;
  }

  // Validar que haya al menos una respuesta correcta por pregunta
  validateForm(): boolean {
    if (this.testForm.invalid) {
      this.showValidationModalWithMessage('Por favor, completa todos los campos requeridos del formulario.');
      return false;
    }
    
    if (this.questions.length === 0) {
      this.showNoQuestionsModal.set(true);
      return false;
    }
    
    const questions = this.questions.value;
    for (const question of questions) {
      const hasCorrectAnswer = question.answers.some((answer: any) => answer.is_correct);
      if (!hasCorrectAnswer) {
        this.showValidationModalWithMessage(`La pregunta "${question.question_text}" debe tener al menos una respuesta correcta.`);
        return false;
      }
    }
    
    return true;
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
        this.fb.group({ answer_text: '', is_correct: false }),
        this.fb.group({ answer_text: '', is_correct: false })
      ])
    }));
  }
  
  getAnswers(qIndex: number): FormArray {
    return this.questions.at(qIndex).get('answers') as FormArray;
  }

  addAnswer(qIndex: number) {
    this.getAnswers(qIndex).push(this.fb.group({ answer_text: '', is_correct: false }));
  }

  // Eliminar pregunta con confirmación
  removeQuestion(index: number): void {
    if (this.questions.length <= 1) {
      this.showValidationModalWithMessage('El test debe tener al menos una pregunta.');
      return;
    }
    
    this.questions.removeAt(index);
  }

  // Eliminar respuesta con confirmación
  removeAnswer(questionIndex: number, answerIndex: number): void {
    if (this.getAnswers(questionIndex).length <= 2) {
      this.showValidationModalWithMessage('Cada pregunta debe tener al menos dos respuestas.');
      return;
    }
    
    this.getAnswers(questionIndex).removeAt(answerIndex);
  }

  submit() {
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
    const testData = {
      ...this.testForm.value,
      created_by: currentUser.id,
      test_date: new Date(this.testForm.value.test_date).toISOString().split('T')[0]
    };

    this.testService.createTest(testData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al crear el test. Por favor, inténtalo de nuevo.');
        this.showErrorModal.set(true);
        console.error('Error creating test:', err);
      }
    });
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
      this.modalTitle.set('¿Descartar cambios?');
      this.modalMessage.set('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?');
      this.modalIcon.set('warning');
      // Aquí se puede agregar un modal de confirmación para salir
      // Por ahora, simplemente redirigimos
    }
    this.router.navigate(['/admin/tests']);
  }

  // Reiniciar formulario
  resetForm(): void {
    this.modalTitle.set('¿Reiniciar formulario?');
    this.modalMessage.set('Se perderán todos los datos ingresados. ¿Estás seguro?');
    this.modalIcon.set('warning');
    // Aquí se podría implementar un modal de confirmación
    this.testForm.reset();
    this.questions.clear();
  }
}