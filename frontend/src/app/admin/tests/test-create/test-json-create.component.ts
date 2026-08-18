import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';
import { TopicsViewerComponent } from './topics-viewer.component';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { TopicsService } from '../../../shared/services/topics.service'; 

@Component({
  selector: 'app-test-json-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    TopicsViewerComponent
  ],
  templateUrl: './test-json-create.component.html'
})
export class TestJsonCreateComponent implements OnInit {
  // Señales existentes
  jsonInput = signal('');
  loading = signal(false);
  previewTest = signal<any>(null);
  showPreview = signal(false);
  validationErrors = signal<string[]>([]);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showConfirmCreateModal = signal(false);
  showConfirmClearModal = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showTopicsModal = signal(false);

  // Nuevas señales para el asistente de IA
  language = signal('Español');
  level = signal('Intermedio');
  numQuestions = signal(10);
  numAnswers = signal(4);
  extraPrompt = signal('');
  topicsHierarchy = signal<any>(null);        // Almacena la jerarquía de topics
  topicsLoaded = signal(false);
  copyPromptMessage = signal('');

  levels = ['Principiante', 'Intermedio', 'Avanzado'];
  languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Chino', 'Japonés', 'Ruso'];

  // Inyectamos el servicio de topics (debe existir)
  private topicsService = inject(TopicsService);

  constructor(
    private testsManagementService: TestsManagementService,
    private authService: AuthService,
    private sharedUtilsService: SharedUtilsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTopics();
  }

  /**
   * Carga los topics existentes desde el servicio
   */
  loadTopics(): void {
    this.topicsService.getTopics().subscribe({
      next: (data) => {
        this.topicsHierarchy.set(data);
        this.topicsLoaded.set(true);
      },
      error: (err) => {
        console.error('Error cargando topics:', err);
        // Si falla, podemos seguir sin topics (el prompt se genera sin ellos)
        this.topicsLoaded.set(false);
      }
    });
  }

  /**
   * Construye el prompt para la IA y lo copia al portapapeles
   */
  generateAIPrompt(): void {
    const language = this.language();
    const level = this.level();
    const numQ = this.numQuestions();
    const numA = this.numAnswers();
    const extra = this.extraPrompt().trim();

    // Ejemplo de estructura JSON (se adapta a numA opciones)
    const exampleQuestions = [
      {
        question_text: 'Ejemplo de pregunta',
        answers: Array.from({ length: numA }, (_, i) => ({
          answer_text: `Opción ${i + 1}`,
          is_correct: i === 0 // Solo una correcta
        }))
      }
    ];

    const exampleJson = {
      title: 'Título del test',
      description: 'Descripción del test',
      main_topic: 'Tema principal',
      sub_topic: 'Subtema',
      specific_topic: 'Tema específico',
      language: language,
      level: level,
      questions: exampleQuestions
    };

    const exampleStr = JSON.stringify(exampleJson, null, 2);

    // Construir la parte de los topics existentes
    let topicsText = 'No se pudieron cargar los temas existentes.';
    if (this.topicsLoaded() && this.topicsHierarchy()) {
      topicsText = this.formatTopics(this.topicsHierarchy());
    }

    const prompt = `Genera un test educativo en ${language} con las siguientes especificaciones:

- Nivel: ${level}
- Número de preguntas: ${numQ}
- Opciones por pregunta: ${numA}

Debes devolver ÚNICAMENTE un objeto JSON con la estructura exacta que se muestra a continuación. No incluyas markdown, ni texto adicional, ni explicaciones. Solo el JSON.

ESTRUCTURA OBLIGATORIA (copia este formato, rellena con tus valores):
${exampleStr}

REGLAS:
- Cada pregunta debe tener EXACTAMENTE ${numA} opciones.
- Solo una opción por pregunta debe ser correcta (is_correct: true).
- Las opciones incorrectas deben ser plausibles pero claramente incorrectas.
- El título, descripción y temas deben ser coherentes con el contenido.

TEMAS EXISTENTES (puedes usar estos o crear nuevos si es necesario):
${topicsText}

${extra ? `INSTRUCCIONES ADICIONALES DEL USUARIO:\n${extra}` : ''}

Asegúrate de que el JSON sea válido. Si hay algún error, incluye un campo "error" explicativo pero siempre en formato JSON.`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(prompt).then(() => {
      this.copyPromptMessage.set('✅ Prompt copiado al portapapeles');
      setTimeout(() => this.copyPromptMessage.set(''), 4000);
    }).catch(() => {
      this.copyPromptMessage.set('❌ Error al copiar. Cópialo manualmente.');
      setTimeout(() => this.copyPromptMessage.set(''), 4000);
    });
  }

  /**
   * Formatea la jerarquía de topics para mostrarla en texto
   */
  private formatTopics(hierarchy: any): string {
    let text = '';
    for (const [mainTopic, subTopics] of Object.entries(hierarchy)) {
      text += `📚 ${mainTopic}\n`;
      for (const [subTopic, specificTopics] of Object.entries(subTopics as Record<string, string[]>)) {
        text += `  ├─ 📖 ${subTopic}\n`;
        if (Array.isArray(specificTopics)) {
          specificTopics.slice(0, 5).forEach(spec => {
            text += `  │   ├─ • ${spec}\n`;
          });
          if (specificTopics.length > 5) {
            text += `  │   └─ ... y ${specificTopics.length - 5} más\n`;
          }
        }
      }
      text += '\n';
    }
    return text || 'No hay temas registrados. Puedes crear nuevos.';
  }

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
    const currentUser = this.authService.currentUser();
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
      created_by: this.authService.currentUser()?.id
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

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
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

  onCancelModalConfirm(): void {
    this.showSuccessModal.set(false);
    this.clearForm();
    // Redirigir después de cerrar el modal    
    setTimeout(() => {
      this.router.navigate(['/admin/tests/json-create']);
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

  openTopicsModal() {
    this.showTopicsModal.set(true);
  }

  closeTopicsModal(): void {
    this.showTopicsModal.set(false);
  }  

}