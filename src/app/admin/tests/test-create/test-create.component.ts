import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TestService } from '../../../core/services/test.service';

@Component({
  selector: 'app-test-create',
  standalone: true,
  templateUrl: './test-create.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})

export class TestCreateComponent {
  testForm: FormGroup;

  constructor(private fb: FormBuilder, private testService: TestService) {
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
    if (this.testForm.invalid) return false;
    
    const questions = this.questions.value;
    for (const question of questions) {
      const hasCorrectAnswer = question.answers.some((answer: any) => answer.is_correct);
      if (!hasCorrectAnswer) {
        alert(`La pregunta "${question.question_text}" debe tener al menos una respuesta correcta.`);
        return false;
      }
    }
    
    return true;
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


  submit() {
    if (!this.validateForm()) return;

    this.testService.createTest(this.testForm.value).subscribe({
      next: (res) => {
        // Mostrar mensaje de éxito con mejor diseño
        console.log('Test creado con éxito:', res);
        // Podrías redirigir a otra página o mostrar un modal de éxito
      },
      error: (err) => {
        console.error('Error al crear test:', err);
      }
    });
  }
}
