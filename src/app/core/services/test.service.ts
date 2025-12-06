import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Result, ResultResponse, Test, TestsResponse } from '../../models/test.model';


@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ====== Admin ======
  createTest(test: Test): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/test/create`, test);
  }

  getAllTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/admin/tests`);
  }

  // ====== Usuario ======
  getTodayTest(): Observable<Test> {
    console.log('TestService: obteniendo el test de hoy...');
    return this.http.get<Test>(`${this.apiUrl}/test/today`);
  }

  getTestById(id: number): Observable<Test> {
    console.log(`TestService: obteniendo el test con ID: ${id}...`);
    return this.http.get<Test>(`${this.apiUrl}/test/${id}`);
  }

  getLatestTest() {
    console.log('TestService: obteniendo el último test disponible...');
    return this.http.get<Test>(`${this.apiUrl}/test/latest`);
  }

  // getTestsForUser(): Observable<TestsResponse> {
  //   console.log('TestService: obteniendo todos los tests para el usuario...');
  //   return this.http.get<TestsResponse>(`${this.apiUrl}/tests/user`);
  // }

    getUserTestResults(): Observable<ResultResponse> {
      console.log('TestService: obteniendo todos los resultados para el usuario...');
      return this.http.get<ResultResponse>(`${this.apiUrl}/tests/results`);
    }

}
