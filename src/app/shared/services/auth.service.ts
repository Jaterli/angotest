import {
  Injectable,
  Inject,
  signal,
  computed,
  PLATFORM_ID,
  effect
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import {
  Observable,
  tap,
  shareReplay,
  of,
  catchError,
  firstValueFrom,
  map
} from 'rxjs';
import { User, RegisterData } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';

  /* ---------------- Signals ---------------- */
  private userSignal = signal<User | null>(null);
  currentUser = computed(() => this.userSignal());

  /* ---------------- Cache ---------------- */
  private userCache: User | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 min

  /* ---------------- Loading ---------------- */
  private loadingSignal = signal<boolean>(false);
  loading = computed(() => this.loadingSignal());

  /* ---------------- HTTP cache ---------------- */
  private userRequest$: Observable<{
    authenticated: boolean;
    user?: User;
  }> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (this.isBrowser()) {
      effect(() => {
        if (this.userSignal() === null) {
          void this.checkAuthStatus();
        }
      });
    }
  }

  /* ---------------- Utils ---------------- */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /* ---------------- Auth bootstrap ---------------- */
  private async checkAuthStatus(): Promise<void> {
    if (!this.isBrowser()) return;

    try {
      const response = await firstValueFrom(this.getCachedAuthCheck());

      if (response.authenticated && response.user) {
        this.setUser(response.user);
      } else {
        this.clearUser();
      }
    } catch (error: any) {
      console.error('Error checking auth status:', error);

      if (error?.status === 401 || error?.status === 403) {
        this.clearUser();
      }
    }
  }

  /* ---------------- Cached auth check ---------------- */
  private getCachedAuthCheck(): Observable<{
    authenticated: boolean;
    user?: User;
  }> {
    const now = Date.now();

    if (
      this.userCache &&
      now - this.lastFetchTime < this.CACHE_TTL
    ) {
      return of({ authenticated: true, user: this.userCache });
    }

    if (this.userRequest$) {
      return this.userRequest$;
    }

    this.loadingSignal.set(true);

    this.userRequest$ = this.http
      .get<{ authenticated: boolean; user?: User }>(
        `${this.API_URL}/check-auth`,
        { withCredentials: true }
      )
      .pipe(
        tap(response => {
          if (response.authenticated && response.user) {
            this.setUser(response.user);
          } else {
            this.clearUser();
          }

          this.loadingSignal.set(false);
          this.userRequest$ = null;
        }),
        catchError(error => {
          this.loadingSignal.set(false);
          this.userRequest$ = null;
          this.clearUser();
          throw error;
        }),
        shareReplay(1)
      );

    return this.userRequest$;
  }

  /* ---------------- Cache helpers ---------------- */
  private setUser(user: User): void {
    this.userSignal.set(user);
    this.userCache = user;
    this.lastFetchTime = Date.now();
  }

  private clearUser(): void {
    this.userSignal.set(null);
    this.userCache = null;
    this.lastFetchTime = 0;
  }

  private invalidateCache(): void {
    this.clearUser();
    this.userRequest$ = null;
  }

  /* ---------------- Public API ---------------- */
  login(
    email: string,
    password: string
  ): Observable<{ user: User; message: string }> {
    return this.http
      .post<{ user: User; message: string }>(
        `${this.API_URL}/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap(res => this.setUser(res.user))
      );
  }

  register(userData: RegisterData): Observable<any> {
    return this.http.post(
      `${this.API_URL}/register`,
      userData
    );
  }

  logout(redirect = true): void {
    this.invalidateCache();

    if (this.isBrowser()) {
      void firstValueFrom(
        this.http.post(
          `${this.API_URL}/logout`,
          {},
          { withCredentials: true }
        )
      ).catch(err =>
        console.error('Error cerrando sesión:', err)
      );
    }

    if (redirect) {
      this.router.navigate(['/login'], {
        queryParams: { message: 'Sesión cerrada exitosamente' }
      });
    }
  }

  verifyAuth(): Observable<{ authenticated: boolean; user?: User }> {
    return this.getCachedAuthCheck();
  }

  get CurrentUser(): Observable<User | null> {
    if (!this.userSignal() && this.isBrowser()) {
      return this.verifyAuth().pipe(map(res => res.user ?? null));
    }
    return of(this.userSignal());
  }

  refreshAuth(): Observable<{
    authenticated: boolean;
    user?: User;
  }> {
    this.invalidateCache();
    this.loadingSignal.set(true);

    return this.http
      .get<{ authenticated: boolean; user?: User }>(
        `${this.API_URL}/check-auth`,
        { withCredentials: true }
      )
      .pipe(
        tap(res => {
          res.authenticated && res.user
            ? this.setUser(res.user)
            : this.clearUser();
          this.loadingSignal.set(false);
        }),
        catchError(err => {
          this.loadingSignal.set(false);
          throw err;
        })
      );
  }
}
