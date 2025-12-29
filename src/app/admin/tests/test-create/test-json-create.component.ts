import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';

@Component({
  selector: 'app-test-json-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  templateUrl: './test-json-create.component.html'
})
export class TestJsonCreateComponent {
  // Señales para el estado
  jsonInput = signal('');
  loading = signal(false);
  previewTest = signal<any>(null);
  showPreview = signal(false);
  validationErrors = signal<string[]>([]);

  // Señales para modales
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showConfirmCreateModal = signal(false);
  showConfirmClearModal = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Opciones de nivel predefinidas
  levels = ['Principiante', 'Intermedio', 'Avanzado'];

  constructor(
    private testsManagementService: TestsManagementService,
    private authService: AuthService,
    private router: Router
  ) {}

  // Método para procesar el JSON pegado
  processJson(): void {
    this.validationErrors.set([]);
    this.showPreview.set(false);

    const jsonText = this.jsonInput().trim();
    
    if (!jsonText) {
      this.errorMessage.set('Por favor, pega un JSON válido');
      this.showErrorModal.set(true);
      return;
    }

    try {
      const parsedJson = JSON.parse(jsonText);
      const validationResult = this.validateTestStructure(parsedJson);
      
      if (validationResult.isValid) {
        this.previewTest.set(parsedJson);
        this.showPreview.set(true);
      } else {
        this.validationErrors.set(validationResult.errors);
        this.errorMessage.set('El JSON tiene errores de validación. Revisa los detalles.');
        this.showErrorModal.set(true);
      }
    } catch (e) {
      this.errorMessage.set('JSON inválido. Por favor, revisa la sintaxis.');
      this.showErrorModal.set(true);
      console.error('Error parsing JSON:', e);
    }
  }

  // Método para validar la estructura del test
  validateTestStructure(testData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar campos requeridos del test según el nuevo modelo
    const requiredFields = ['title', 'main_topic', 'level'];
    for (const field of requiredFields) {
      if (!testData[field]) {
        errors.push(`Falta el campo requerido: ${field}`);
      }
    }

    // Validar campos opcionales pero recomendados
    const recommendedFields = ['description', 'sub_topic', 'specific_topic'];
    for (const field of recommendedFields) {
      if (!testData[field]) {
        console.log(`Campo ${field} no presente, se establecerá como 'General'`);
      }
    }

    // Validar nivel
    if (testData.level && !this.levels.includes(testData.level)) {
      errors.push(`Nivel inválido. Los niveles válidos son: ${this.levels.join(', ')}`);
    }

    // Validar preguntas
    if (!testData.questions || !Array.isArray(testData.questions)) {
      errors.push('Debe haber un array de preguntas');
    } else {
      if (testData.questions.length === 0) {
        errors.push('El test debe tener al menos una pregunta');
      }

      testData.questions.forEach((question: any, index: number) => {
        if (!question.question_text) {
          errors.push(`Pregunta ${index + 1}: falta el texto de la pregunta`);
        }

        if (!question.answers || !Array.isArray(question.answers)) {
          errors.push(`Pregunta ${index + 1}: debe tener un array de respuestas`);
        } else {
          if (question.answers.length < 2) {
            errors.push(`Pregunta ${index + 1}: debe tener al menos 2 respuestas`);
          }

          let hasCorrectAnswer = false;
          question.answers.forEach((answer: any, ansIndex: number) => {
            if (!answer.answer_text) {
              errors.push(`Pregunta ${index + 1}, Respuesta ${ansIndex + 1}: falta el texto de la respuesta`);
            }
            if (answer.is_correct) {
              hasCorrectAnswer = true;
            }
          });

          if (!hasCorrectAnswer) {
            errors.push(`Pregunta ${index + 1}: ninguna respuesta está marcada como correcta`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Método para mostrar confirmación de creación
  confirmCreate(): void {
    if (!this.previewTest()) return;
    this.showConfirmCreateModal.set(true);
  }

  // Método para crear el test
  createTest(): void {
    this.showConfirmCreateModal.set(false);
    
    if (!this.previewTest()) return;

    this.loading.set(true);
    
    // Obtener el ID del usuario autenticado
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.errorMessage.set('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
      this.showErrorModal.set(true);
      this.loading.set(false);
      return;
    }

    // Preparar el objeto test con el usuario autenticado
    const testData = this.prepareTestData();

    this.testsManagementService.createTest(testData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(`Test "${this.previewTest().title}" creado exitosamente con ${this.previewTest().questions.length} preguntas.`);
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

  private prepareTestData(): any {
    const preview = this.previewTest();
    
    return {
      title: preview.title.trim(),
      description: preview.description?.trim() || '',
      main_topic: preview.main_topic || 'General',
      sub_topic: preview.sub_topic || 'General',
      specific_topic: preview.specific_topic || 'General',
      level: preview.level || 'Principiante',
      questions: preview.questions.map((question: any) => ({
        question_text: question.question_text.trim(),
        answers: question.answers.map((answer: any) => ({
          answer_text: answer.answer_text.trim(),
          is_correct: answer.is_correct || false
        }))
      })),
      created_by: this.authService.getUser()?.id
    };
  }

  private getErrorMessage(err: any): string {
    if (err.error?.error) {
      return err.error.error;
    }
    
    if (err.status === 400) {
      return 'Datos inválidos enviados. Por favor, verifica la estructura del JSON.';
    }
    
    if (err.status === 401) {
      return 'No tienes permisos para crear tests.';
    }
    
    if (err.status === 500) {
      return 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    return 'Error al crear el test. Por favor, verifica los datos e intenta nuevamente.';
  }

  // Método para confirmar limpieza del formulario
  confirmClearForm(): void {
    if (this.jsonInput().trim()) {
      this.showConfirmClearModal.set(true);
    } else {
      this.clearForm();
    }
  }

  // Método para limpiar el formulario
  clearForm(): void {
    this.jsonInput.set('');
    this.previewTest.set(null);
    this.showPreview.set(false);
    this.validationErrors.set([]);
    this.showConfirmClearModal.set(false);
  }

  // Método para pegar un ejemplo de JSON actualizado
  pasteExample(): void {
    const exampleJson = {
      "title": "Fundamentos de Programación",
      "description": "Test básico sobre conceptos fundamentales de programación",
      "main_topic": "Ciencias de la Computación",
      "sub_topic": "Fundamentos de Programación",
      "specific_topic": "Sintaxis y Variables",
      "level": "Principiante",
      "questions": [
        {
          "question_text": "¿Qué es una variable?",
          "answers": [
            {
              "answer_text": "Un valor constante que no cambia",
              "is_correct": false
            },
            {
              "answer_text": "Un espacio en memoria para almacenar datos",
              "is_correct": true
            },
            {
              "answer_text": "Un tipo de bucle",
              "is_correct": false
            },
            {
              "answer_text": "Un operador matemático",
              "is_correct": false
            }
          ]
        },
        {
          "question_text": "¿Qué estructura se usa para tomar decisiones?",
          "answers": [
            {
              "answer_text": "Bucle for",
              "is_correct": false
            },
            {
              "answer_text": "If-else",
              "is_correct": true
            },
            {
              "answer_text": "Array",
              "is_correct": false
            },
            {
              "answer_text": "Función",
              "is_correct": false
            }
          ]
        }
      ]
    };

    this.jsonInput.set(JSON.stringify(exampleJson, null, 2));
  }

  // Método para mostrar/ocultar el preview
  togglePreview(): void {
    this.showPreview.update(value => !value);
  }

  // Método para formatear el JSON
  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonInput());
      this.jsonInput.set(JSON.stringify(parsed, null, 2));
    } catch (e) {
      this.errorMessage.set('No se puede formatear JSON inválido. Verifica la sintaxis.');
      this.showErrorModal.set(true);
    }
  }

  // Método para ir a la lista de tests
  goToList(): void {
    this.router.navigate(['/admin/tests']);
  }

  // Métodos de manejo de modales
  onSuccessModalConfirm(): void {
    this.showSuccessModal.set(false);
    // Redirigir después de cerrar el modal
    setTimeout(() => {
      this.router.navigate(['/admin/tests']);
    }, 300);
  }

  onErrorModalConfirm(): void {
    this.showErrorModal.set(false);
  }

  onCancelCreate(): void {
    this.showConfirmCreateModal.set(false);
  }

  onCancelClear(): void {
    this.showConfirmClearModal.set(false);
  }
}