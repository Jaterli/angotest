// home.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  
  // Señales para los contadores animados
  animatedTestsCount = signal<number>(0);
  animatedUsersCount = signal<number>(0);
  animatedTopicsCount = signal<number>(0);
  
  // Valores objetivo
  private readonly targetTests = 12500;    // 12.5k para mostrar "12.5k+"
  private readonly targetUsers = 528;       // 528 para mostrar "528+"
  private readonly targetTopics = 67;        // 67 para mostrar "67+"
  
  // Para el tema oscuro/claro
  currentTheme = signal<'light' | 'dark'>('light');
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
  
  // Para el loader de imágenes
  imagesLoaded = signal<boolean>(false);
  
  // Para el modal de demo (opcional)
  showDemoModal = signal<boolean>(false);
  
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.initThemeDetection();
    this.startCountersAnimation();
    this.preloadImages();
    
    // Smooth scroll para anclas (ej: #demo)
    this.setupSmoothScroll();
  }
  
  ngOnDestroy(): void {
    // Limpiar listeners
    if (this.mediaQuery && this.mediaQueryListener && isPlatformBrowser(this.platformId)) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryListener);
    }
  }
  
  /**
   * Inicia la animación de los contadores
   */
  private startCountersAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const duration = 2000; // 2 segundos
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      
      // Easing suave (easeOutQuart)
      const eased = 1 - Math.pow(1 - progress, 4);
      
      this.animatedTestsCount.set(Math.floor(eased * this.targetTests));
      this.animatedUsersCount.set(Math.floor(eased * this.targetUsers));
      this.animatedTopicsCount.set(Math.floor(eased * this.targetTopics));
      
      if (progress >= 1) {
        clearInterval(timer);
        // Asegurar valores finales exactos
        this.animatedTestsCount.set(this.targetTests);
        this.animatedUsersCount.set(this.targetUsers);
        this.animatedTopicsCount.set(this.targetTopics);
      }
    }, interval);
  }
  
  /**
   * Detecta el tema del sistema y sincroniza con el script del index.html
   */
  private initThemeDetection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Leer tema actual del HTML (ya lo pone el script del index.html)
    const isDark = document.documentElement.classList.contains('dark');
    this.currentTheme.set(isDark ? 'dark' : 'light');
    
    // Escuchar cambios en la preferencia del sistema
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        this.currentTheme.set('dark');
      } else {
        document.documentElement.classList.remove('dark');
        this.currentTheme.set('light');
      }
    };
    
    this.mediaQuery.addEventListener('change', this.mediaQueryListener);
  }
  
  /**
   * Precarga imágenes importantes (como el logo)
   */
  private preloadImages(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Si tienes un logo real, precárgalo
    const logoImg = new Image();
    logoImg.src = 'assets/images/logo-angotest.png';
    logoImg.onload = () => this.imagesLoaded.set(true);
    logoImg.onerror = () => this.imagesLoaded.set(true); // Fallback aunque falle
    
    // Timeout por si la imagen tarda demasiado
    setTimeout(() => this.imagesLoaded.set(true), 3000);
  }
  
  /**
   * Configura smooth scroll para enlaces internos (#)
   */
  private setupSmoothScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  /**
   * Navegación programática
   */
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
  
  /**
   * Formateadores para las estadísticas
   */
  formatTestsCount(): string {
    const count = this.animatedTestsCount();
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k+';
    }
    return count + '+';
  }
  
  formatUsersCount(): string {
    return this.animatedUsersCount() + '+';
  }
  
  formatTopicsCount(): string {
    return this.animatedTopicsCount() + '+';
  }
  
  /**
   * Para el modal de demo (si decides implementarlo)
   */
  closeDemoModal(): void {
    this.showDemoModal.set(false);
  }
}