// theme.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal para el tema actual
  private themeSignal = signal<Theme>('system');
  
  // Computed para el tema efectivo (respetando preferencias del sistema)
  currentTheme = computed(() => {
    const theme = this.themeSignal();
    
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return theme;
  });

  // Computed para saber si está en modo oscuro
  isDarkMode = computed(() => this.currentTheme() === 'dark');

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    // Leer del localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this.themeSignal.set(savedTheme);
    } else {
      // Usar preferencia del sistema por defecto
      this.themeSignal.set('system');
    }
    
    // Aplicar el tema al cargar
    this.applyTheme();
    
    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.themeSignal() === 'system') {
        this.applyTheme();
      }
    });
  }

  private applyTheme() {
    const theme = this.currentTheme();
    const htmlElement = document.documentElement;
    
    // Usando clase .dark
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    // O usando data attribute (elegir uno)
    // htmlElement.setAttribute('data-theme', theme);
  }

  setTheme(theme: Theme) {
    this.themeSignal.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  toggleTheme() {
    const current = this.themeSignal();
    
    if (current === 'system') {
      // Si está en sistema, cambiar a oscuro
      this.setTheme('dark');
    } else if (current === 'dark') {
      // Si está en oscuro, cambiar a claro
      this.setTheme('light');
    } else {
      // Si está en claro, cambiar a sistema
      this.setTheme('system');
    }
  }
}