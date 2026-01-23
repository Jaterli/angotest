import { Injectable, Inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Observable, tap, firstValueFrom, map } from 'rxjs';
import { User, RegisterData } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly USER_KEY = 'angotest_user';

  // Signals
  private userSignal = signal<User| null>(null);
  currentUser = computed(() => this.userSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo inicializar usuario desde localStorage
    if (this.isBrowser()) {
      const storedUser = this.readFromStorage<User>(this.USER_KEY);
      this.userSignal.set(storedUser);
      
      // Verificar autenticación con el backend
      this.checkAuthStatus();
    }
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
      
      return JSON.parse(item) as T;
    } catch {
      console.error(`Error reading "${key}" from localStorage`);
      return null;
    }
  }

  private writeToStorage(key: string, value: any): void {
    if (!this.isBrowser()) return;

    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  private async checkAuthStatus(): Promise<void> {
    if (!this.isBrowser()) return;
    
    try {
      const response = await firstValueFrom(
        this.http.get<{ authenticated: boolean; user?: User }>(
          `${this.API_URL}/check-auth`,
          { withCredentials: true } // IMPORTANTE: envía cookies automáticamente
        )
      );
      
      if (response.authenticated && response.user) {
        this.userSignal.set(response.user);
        this.writeToStorage(this.USER_KEY, response.user);
      } else {
        // Limpiar si no está autenticado
        this.userSignal.set(null);
        this.writeToStorage(this.USER_KEY, null);
      }
    } catch (error: any) {
      console.error('Error checking auth status:', error);
      
      // Si hay error 401 o similar, limpiar estado
      if (error.status === 401 || error.status === 403) {
        this.userSignal.set(null);
        this.writeToStorage(this.USER_KEY, null);
      }
    }
  }

  // --- API pública ---
  login(email: string, password: string): Observable<{ user: User; message: string }> {
    return this.http.post<{ user: User; message: string }>(
      `${this.API_URL}/login`, 
      { email, password },
      { withCredentials: true } // IMPORTANTE: envía/recibe cookies
    ).pipe(
      tap(response => {
        this.userSignal.set(response.user);
        this.writeToStorage(this.USER_KEY, response.user);
      })
    );
  }

  register(userData: RegisterData): Observable<any> {
    return this.http.post(
      `${this.API_URL}/register`, 
      userData
    );
  }

  logout(redirect = true): void {
    // Llamar al backend para limpiar la cookie
    if (this.isBrowser()) {
      this.http.post(
        `${this.API_URL}/logout`, 
        {},
        { withCredentials: true }
      ).subscribe({
        next: () => {
          console.log('Sesión cerrada en el backend');
        },
        error: (err) => {
          console.error('Error cerrando sesión en backend:', err);
        }
      });
    }
    
    // Limpiar estado local
    this.writeToStorage(this.USER_KEY, null);
    this.userSignal.set(null);
    
    if (redirect) {
      this.router.navigate(['/login'], { 
        queryParams: { message: 'Sesión cerrada exitosamente' }
      });
    }
  }

  // Verificar autenticación (útil para guards)
  verifyAuth(): Observable<{ authenticated: boolean; user?: User }> {
    return this.http.get<{ authenticated: boolean; user?: User }>(
      `${this.API_URL}/check-auth`,
      { withCredentials: true }
    );
  }

  // --- Métodos de conveniencia (compatibilidad) ---
  // getUser(): User | null {
  //   return this.userSignal();
  // }

  // getUserRole(): string | null {
  //   return this.userSignal()?.role || null;
  // }

  // isAdmin(): boolean {
  //   return this.getUserRole() === 'admin';
  // }

  // // Para forzar una verificación de autenticación
  // refreshAuthStatus(): Promise<boolean> {
  //   return firstValueFrom(
  //     this.verifyAuth().pipe(
  //       tap(response => {
  //         this.isAuthSignal.set(response.authenticated);
  //         if (response.authenticated && response.user) {
  //           this.userSignal.set(response.user);
  //           this.writeToStorage(this.USER_KEY, response.user);
  //         }
  //       }),
  //       map(response => response.authenticated)
  //     )
  //   );
  // }
}