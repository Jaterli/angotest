import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SaveResultInput, 
  ResumeTestResponse, 
  InProgressTestsResponse, 
  CompletedTestsResponse,
  TestsWithStatusResponse,
  Test 
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

  getTodayTest(): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/today`);
  }

  getTestById(id: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/${id}/start`);
  }

  getLatestTest(): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/latest`);
  }

  // ====== Nuevos métodos optimizados ======
  
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
  getInProgressTests(): Observable<InProgressTestsResponse> {
    console.log('TestService: obteniendo tests en progreso...');
    return this.http.get<InProgressTestsResponse>(`${this.apiUrl}/tests/in-progress`);
  }

  // Obtener tests completados
  getCompletedTests(): Observable<CompletedTestsResponse> {
    console.log('TestService: obteniendo tests completados...');
    return this.http.get<CompletedTestsResponse>(`${this.apiUrl}/tests/completed`);
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

  // // Mantener compatibilidad (para componentes existentes)
  // getUserTestResults(): Observable<any> {
  //   console.log('TestService: obteniendo resultados del usuario...');
  //   return this.http.get<any>(`${this.apiUrl}/tests/results`);
  // }

  // // Método de compatibilidad (para código existente)
  // submitTestResult(testId: number, result: any): Observable<any> {
  //   console.log(`TestService: enviando resultado del test ${testId}...`);
  //   // Convertir al nuevo formato
  //   const saveData: SaveResultInput = {
  //     test_id: testId,
  //     answers: result.answers || [],
  //     time_taken: result.time_taken || 0,
  //     status: 'completed'
  //   };
  //   return this.saveOrUpdateResult(saveData);
  // }
}