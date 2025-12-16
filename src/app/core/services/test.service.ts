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
  InProgressTestsFilter
} from '../../models/test.model';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ====== Métodos existentes ======
  createTest(test: Test): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/tests/create`, test);
  }

  updateTest(id: number, test: Test): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/tests/edit/${id}`, test);
  }

  deleteTest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/tests/delete/${id}`);
  }

  getAllTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/admin/tests`);
  }

  getTestById(id: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/${id}`);
  }

  
  // Guardar progreso o finalizar test
  saveOrUpdateResult(data: SaveResultInput): Observable<any> {
    console.log('TestService: guardando resultado...', data);
    return this.http.post(`${this.apiUrl}/tests/${data.test_id}/save`, data);
  }

  // Obtener progreso de un test
  getTestProgress(testId: number): Observable<ResumeTestResponse> {
    console.log(`TestService: obteniendo progreso del test ${testId}...`);
    return this.http.get<ResumeTestResponse>(`${this.apiUrl}/tests/${testId}/progress`);
  }

  // Obtener tests en progreso
  // getInProgressTests(): Observable<InProgressTestsResponse> {
  //   console.log('TestService: obteniendo tests en progreso...');
  //   return this.http.get<InProgressTestsResponse>(`${this.apiUrl}/tests/in-progress`);
  // }

  // Obtener tests completados
  // getCompletedTests(): Observable<CompletedTestsResponse> {
  //   console.log('TestService: obteniendo tests completados...');
  //   return this.http.get<CompletedTestsResponse>(`${this.apiUrl}/tests/completed`);
  // }

  // ====== Método para tests completados con filtros ======
  
  getMyCompletedTests(
    filter: CompletedTestsFilter = {}
  ): Observable<CompletedTestsFullResponse> {
    let params = new HttpParams();
    
    if (filter.page) {
      params = params.set('page', filter.page.toString());
    }
    
    if (filter.page_size) {
      params = params.set('page_size', filter.page_size.toString());
    }
    
    if (filter.main_topic && filter.main_topic !== 'all') {
      params = params.set('main_topic', filter.main_topic);
    }
    
    if (filter.level && filter.level !== 'all') {
      params = params.set('level', filter.level);
    }
    
    if (filter.sort_by) {
      params = params.set('sort_by', filter.sort_by);
    }
    
    if (filter.sort_order) {
      params = params.set('sort_order', filter.sort_order);
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
    
    if (filter.page) {
      params = params.set('page', filter.page.toString());
    }
    
    if (filter.page_size) {
      params = params.set('page_size', filter.page_size.toString());
    }
    
    if (filter.main_topic && filter.main_topic !== 'all') {
      params = params.set('main_topic', filter.main_topic);
    }
    
    if (filter.level && filter.level !== 'all') {
      params = params.set('level', filter.level);
    }
    
    if (filter.sort_by) {
      params = params.set('sort_by', filter.sort_by);
    }
    
    if (filter.sort_order) {
      params = params.set('sort_order', filter.sort_order);
    }

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
    level?: string
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