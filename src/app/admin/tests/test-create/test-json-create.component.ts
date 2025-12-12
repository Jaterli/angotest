import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { ModalComponent } from '../../../components/modal.component';
import { AuthService } from '../../../services/auth.service';

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

  constructor(
    private testService: TestService,
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

    // Validar campos requeridos del test
    const requiredFields = ['title', 'description', 'category', 'level', 'test_date'];
    for (const field of requiredFields) {
      if (!testData[field]) {
        errors.push(`Falta el campo requerido: ${field}`);
      }
    }

    // Validar formato de fecha
    if (testData.test_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(testData.test_date)) {
        errors.push('El campo test_date debe tener formato YYYY-MM-DD');
      }
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
    const testData = {
      ...this.previewTest(),
      created_by: currentUser.id,
      // Asegurar que test_date tenga el formato correcto
      test_date: new Date(this.previewTest().test_date).toISOString().split('T')[0]
    };

    this.testService.createTest(testData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(`Test "${this.previewTest().title}" creado exitosamente con ${this.previewTest().questions.length} preguntas.`);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al crear el test. Por favor, verifica los datos e intenta nuevamente.');
        this.showErrorModal.set(true);
        console.error('Error creating test:', err);
      }
    });
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

  // Método para pegar un ejemplo de JSON
  pasteExample(): void {
    const exampleJson = {
      "title": "Fundamentos de Programación",
      "description": "Test básico sobre conceptos fundamentales de programación",
      "category": "Programación",
      "level": "Principiante",
      "test_date": "2024-12-10",
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