import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from '../../../core/services/test.service';
import { ResultService } from '../../../core/services/result.service';
import { ActivatedRoute } from '@angular/router';
import { Test } from '../../../models/test.model';

@Component({
  selector: 'app-test-resolve',
  standalone: true,
  templateUrl: './test-resolve.component.html',
  imports: [CommonModule]
})
export class TestResolveComponent implements OnInit {

  test?: Test;
  selectedAnswers: Record<number, number> = {}; // Para almacenar respuestas seleccionadas
  loading = signal(true);
  startTime = 0;

  constructor(
    private testService: TestService,
    private resultService: ResultService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const testId = +params['id'];

      this.testService.getTestById(testId).subscribe({
        next: (res: any) => {
          console.log('Test cargado:', res);
          this.test = res.test;
          this.startTime = Date.now();
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
    });
  }

  isQuestionAnswered(questionId: number): boolean {
    return this.selectedAnswers[questionId] !== undefined;
  }

  getAnsweredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  submitTest() {
    if (!this.test) return;

    const answers = Object.entries(this.selectedAnswers).map(([qid, aid]) => ({
      question_id: +qid,
      answer_id: +aid
    }));

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

    this.resultService.submitResult(this.test.id!, answers, timeSpent).subscribe({
      next: () => alert('Resultado enviado con éxito'),
      error: (err) => console.error(err)
    });
  }

  selectAnswer(questionId: number, answerId: number) {
    this.selectedAnswers[questionId] = answerId;
  }
}
