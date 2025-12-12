import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompletedTestsResponse, NotCompletedTestsResponse, Result, ResultResponse, Test, TestsResponse, TestsWithStatusResponse } from '../../models/test.model';


@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ====== Admin ======
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

  // ====== Usuario ======
  getTodayTest(): Observable<Test> {
    console.log('TestService: obteniendo el test de hoy...');
    return this.http.get<Test>(`${this.apiUrl}/tests/today`);
  }

  getTestById(id: number): Observable<Test> {
    console.log(`TestService: obteniendo el test con ID: ${id}...`);
    return this.http.get<Test>(`${this.apiUrl}/tests/${id}/start`);
  }

  getLatestTest(): Observable<Test> {
    console.log('TestService: obteniendo el último test disponible...');
    return this.http.get<Test>(`${this.apiUrl}/tests/latest`);
  }

  // Nuevos métodos
  getNotCompletedTests(): Observable<NotCompletedTestsResponse> {
    console.log('TestService: obteniendo tests no completados...');
    return this.http.get<NotCompletedTestsResponse>(`${this.apiUrl}/tests/not-completed`);
  }

  getCompletedTests(): Observable<CompletedTestsResponse> {
    console.log('TestService: obteniendo tests completados...');
    return this.http.get<CompletedTestsResponse>(`${this.apiUrl}/tests/completed`);
  }

  getAllTestsWithStatus(): Observable<TestsWithStatusResponse> {
    console.log('TestService: obteniendo todos los tests con estado...');
    return this.http.get<TestsWithStatusResponse>(`${this.apiUrl}/tests/with-status`);
  }

  getUserTestResults(): Observable<ResultResponse> {
    console.log('TestService: obteniendo todos los resultados para el usuario...');
    return this.http.get<ResultResponse>(`${this.apiUrl}/tests/results`);
  }

  submitTestResult(testId: number, result: any): Observable<any> {
    console.log(`TestService: enviando resultados del test ${testId}...`);
    return this.http.post(`${this.apiUrl}/tests/${testId}/submit`, result);
  }
}