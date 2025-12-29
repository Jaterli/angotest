import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncorrectAnswersResponse } from '../models/result.model';

interface AnswerSubmit {
  question_id: number;
  answer_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  submitResult(testId: number, answers: AnswerSubmit[], timeSpent: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/tests/submit-result`, { test_id: testId, answers, time_taken: timeSpent });
  }

 getIncorrectAnswers(resultId: number): Observable<IncorrectAnswersResponse> {
  console.log(`TestService: obteniendo respuestas incorrectas para resultado ${resultId}...`);
  return this.http.get<IncorrectAnswersResponse>(
    `${this.apiUrl}/results/${resultId}/incorrect-answers`
  );
}
  

}


