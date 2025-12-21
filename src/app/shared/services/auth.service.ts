// src/app/core/services/auth.service.ts
import { Injectable, Inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, UserUpdateData, ChangePasswordData, RegisterData } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'angotest_token';
  private readonly USER_KEY = 'angotest_user';

  // Signals inicializados sin parámetros
  private tokenSignal = signal<string | null>(null);
  private userSignal = signal<User | null>(null);
  
  isLoggedIn = computed(() => !!this.tokenSignal());
  currentUser = computed(() => this.userSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Inicializar datos desde storage DESPUÉS del constructor
    this.tokenSignal.set(this.readFromStorage(this.TOKEN_KEY));
    this.userSignal.set(this.readFromStorage(this.USER_KEY));
  }

  // --- Métodos privados ---
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

private readFromStorage<T>(key: string): T | null {
  if (!this.isBrowser()) return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    // Parsear solo si es JSON
    return key === this.USER_KEY ? JSON.parse(item) : item as T;
  } catch {
    console.error(`Error reading "${key}" from localStorage`);
    return null;
  }
}

private writeToStorage(key: string, value: any): void {
  if (!this.isBrowser()) return;

  try {
    if (key === this.TOKEN_KEY) {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value); 
      }
      return;
    }

    // El usuario sí va en JSON
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }

  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

  // --- API pública ---
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setAuthState(response);
        })
      );
  }

  register(userData: RegisterData): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  private setAuthState(data: AuthResponse): void {
    // Guardar en localStorage
    this.writeToStorage(this.TOKEN_KEY, data.token);
    this.writeToStorage(this.USER_KEY, data.user);
    
    // Actualizar signals
    this.tokenSignal.set(data.token);
    this.userSignal.set(data.user);
  }

  logout(redirect = true): void {
    // Limpiar localStorage
    this.writeToStorage(this.TOKEN_KEY, null);
    this.writeToStorage(this.USER_KEY, null);
    
    // Resetear signals
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    
    if (redirect) {
      this.router.navigate(['/login#logout']);
    }
  }

  // --- Métodos de conveniencia (compatibilidad) ---
  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): User | null {
    return this.userSignal();
  }

  getUserRole(): string | null {
    return this.userSignal()?.role || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // Para compatibilidad con código existente
  hasToken(): boolean {
    return this.isLoggedIn();
  }
}

