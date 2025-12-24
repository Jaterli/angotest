import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SaveResultInput, 
  ResumeTestResponse, 
  TestsWithStatusResponse,
  Test,
  NotStartedTestsResponse,
  CompletedTestsFullResponse,
  CompletedTestsFilter,
  InProgressTestsFullResponse,
  InProgressTestsFilter,
  QuestionsResponse,
  SingleQuestionResponse,
  NextQuestionResponse 
} from '../../models/test.model';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}


  // Obtener la siguiente pregunta sin responder
  getNextUnansweredQuestion(testId: number): Observable<NextQuestionResponse> {
    return this.http.get<NextQuestionResponse>(
      `${this.apiUrl}/tests/${testId}/next-question`
    );
  }

  // Obtener todas las preguntas de un test (paginadas)
  getTestQuestions(testId: number, page: number = 1, pageSize: number = 1): Observable<QuestionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    
    return this.http.get<QuestionsResponse>(`${this.apiUrl}/tests/${testId}/questions`, { params });
  }

  // Obtener una pregunta específica
  getSingleQuestion(testId: number, questionNumber: number): Observable<SingleQuestionResponse> {
    return this.http.get<SingleQuestionResponse>(
      `${this.apiUrl}/tests/${testId}/questions/${questionNumber}`
    );
  }

  getTestById(testId: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/${testId}`);
  }
  
  // Guardar progreso o finalizar test
  saveOrUpdateResult(data: SaveResultInput): Observable<any> {
    return this.http.post(`${this.apiUrl}/tests/${data.test_id}/save`, data);
  }

  // Obtener progreso de un test
  getTestProgress(testId: number): Observable<ResumeTestResponse> {
    return this.http.get<ResumeTestResponse>(`${this.apiUrl}/tests/${testId}/progress`);
  }

  
  // ====== Método para tests completados con filtros ======
  getMyCompletedTests(
    filter: CompletedTestsFilter = {}
  ): Observable<CompletedTestsFullResponse> {
    let params = new HttpParams();
    
    // Parámetros obligatorios con valores por defecto
    params = params.set('page', (filter.page || 1).toString());
    params = params.set('page_size', (filter.page_size || 10).toString());
    
    // Parámetros de filtro (solo si tienen valor y no son 'all')
    if (filter.main_topic && filter.main_topic !== 'all') {
      params = params.set('main_topic', filter.main_topic);
    }
    
    if (filter.level && filter.level !== 'all') {
      params = params.set('level', filter.level);
    }
    
    // Parámetros de ordenación con valores por defecto
    params = params.set('sort_by', filter.sort_by || 'date');
    params = params.set('sort_order', filter.sort_order || 'desc');

    // Agregar nuevos filtros opcionales
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    
    if (filter.from_date) {
      params = params.set('from_date', filter.from_date);
    }
    
    if (filter.to_date) {
      params = params.set('to_date', filter.to_date);
    }

    return this.http.get<CompletedTestsFullResponse>(
      `${this.apiUrl}/tests/completed`, 
      { params }
    );
  }

  // ====== Método para tests en progreso con filtros ======
  getMyInProgressTests(
    filter: InProgressTestsFilter = {}
  ): Observable<InProgressTestsFullResponse> {
    let params = new HttpParams();
    
    // Parámetros obligatorios con valores por defecto
    params = params.set('page', (filter.page || 1).toString());
    params = params.set('page_size', (filter.page_size || 10).toString());
    
    // Parámetros de filtro (solo si tienen valor y no son 'all')
    if (filter.main_topic && filter.main_topic !== 'all') {
      params = params.set('main_topic', filter.main_topic);
    }
    
    if (filter.level && filter.level !== 'all') {
      params = params.set('level', filter.level);
    }
    
    // Parámetros de ordenación con valores por defecto
    params = params.set('sort_by', filter.sort_by || 'updated');
    params = params.set('sort_order', filter.sort_order || 'desc');

    return this.http.get<InProgressTestsFullResponse>(
      `${this.apiUrl}/tests/in-progress`, 
      { params }
    );
  }
  

  // ======= Nuevo método para tests por hacer ======
  getNotStartedTests(
    page: number = 1, 
    pageSize: number = 10, 
    mainTopic?: string, 
    level?: string,
    sortBy?: string,
    sortOrder?: string
  ): Observable<NotStartedTestsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (mainTopic && mainTopic !== 'all') {
      params = params.set('main_topic', mainTopic);
    }
    
    if (level && level !== 'all') {
      params = params.set('level', level);
    }

    // Agregar parámetros de ordenación si existen
    if (sortBy) {
      params = params.set('sort_by', sortBy);
    }
    
    if (sortOrder) {
      params = params.set('sort_order', sortOrder);
    }

    return this.http.get<NotStartedTestsResponse>(
      `${this.apiUrl}/tests/not-started`, 
      { params }
    );
  }


  // Eliminar progreso de un test
  deleteTestProgress(testId: number): Observable<any> {
    console.log(`TestService: eliminando progreso del test ${testId}...`);
    return this.http.delete(`${this.apiUrl}/tests/${testId}/progress`);
  }

  // Obtener todos los tests con estado
  getAllTestsWithStatus(): Observable<TestsWithStatusResponse> {
    console.log('TestService: obteniendo todos los tests con estado...');
    return this.http.get<TestsWithStatusResponse>(`${this.apiUrl}/tests/with-status`);
  }

}