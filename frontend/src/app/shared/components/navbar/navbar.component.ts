// src/app/components/navbar/navbar.component.ts
import { Component, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../theme-toggle.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  showMobileMenu = signal(false);
  showUserDropdown = signal(false);
  userProfilePic = signal<string | null>(null);
  
  // Señal para controlar si el menú está compactado
  isScrolled = signal(false);
  
  // Clases específicas para cada tipo de enlace
  classes = {
    logo: 'text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer',
    link: 'text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
    mobileLink: 'block py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
    dropdownLink: 'flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
    userButton: 'flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
    mobileMenuButton: 'inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500'
  };

  // Clases para estado activo
  activeClasses = {
    link: 'text-sky-600 dark:text-sky-400 font-semibold',
    mobile: 'text-sky-600 dark:text-sky-400 font-semibold bg-blue-50 dark:bg-blue-900/20',
    dropdown: 'bg-blue-50 dark:bg-blue-900/20 text-sky-600 dark:text-sky-400 font-semibold'
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Verificar posición inicial del scroll
    this.checkScroll();
  }

  ngOnDestroy() {
    // Limpiar si es necesario
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScroll();
  }

  private checkScroll() {
    // Cambiar el estado cuando el scroll sea mayor a 10px
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    this.isScrolled.set(scrollPosition > 10);
  }
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstName = this.currentUser.first_name || '';
    const lastName = this.currentUser.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (this.currentUser.username) {
      return this.currentUser.username.charAt(0).toUpperCase();
    } else if (this.currentUser.email) {
      return this.currentUser.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Usuario';
      
    if (this.currentUser.username) {
      return '@'+this.currentUser.username;
    }
      
    if (this.currentUser.first_name && this.currentUser.last_name) {
      return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
    }
    
    if (this.currentUser.email) {
      return this.currentUser.email.split('@')[0];
    }
    
    return 'Usuario';
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(value => !value);
    this.showUserDropdown.set(false);    
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);      
  }

  get isLoggedIn() {
    if (this.authService.currentUser()) { return true }
    return false;
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  get userName() {
    return this.currentUser?.username;
  }

  get userRole() {
    return this.currentUser?.role;
  }

  getHomeRoute(): string {
    if (!this.isLoggedIn) {
      return '/';
    }
    
    switch (this.userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'user':
        return '/dashboard';
      case 'guest':
        return '/user/profile';
      default:
        return '/';
    }
  }

  shouldShowAdminMenu(): boolean {
    return this.isLoggedIn && this.currentUser?.role == 'admin';
  }

  shouldShowUserMenu(): boolean {
    return this.isLoggedIn && this.currentUser?.role == 'user';
  }

  logout() {
    this.authService.logout();
    this.showUserDropdown.set(false);
    this.showMobileMenu.set(false);    
  }
}