import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TestService } from '../../../core/services/test.service';

@Component({
  selector: 'app-test-create',
  standalone: true,
  templateUrl: './test-create.component.html',
  styleUrls: ['./test-create.component.scss'],
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
    if (this.testForm.invalid) return;

    this.testService.createTest(this.testForm.value).subscribe({
      next: (res) => alert('Test creado con éxito'),
      error: (err) => console.error(err)
    });
  }
}
