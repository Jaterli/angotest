// src/app/components/navbar/navbar.component.ts
import { Component, signal, computed } from '@angular/core';
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
export class NavbarComponent {
  showMobileMenu = signal(false);

  constructor(private authService: AuthService) {}

  toggleMobileMenu(): void {
    this.showMobileMenu.update(value => !value);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  // Exponer señales y propiedades para template
  get isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  get currentUser() {
    return this.authService.getUser();
  }

  get userEmail() {
    return this.currentUser?.email;
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
      case 'usuario':
        return '/user/tests';
      default:
        return '/';
    }
  }

  // Métodos para verificar roles específicos
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isUser(): boolean {
    return this.userRole === 'user' || this.userRole === 'usuario';
  }

  // Helper para menús específicos
  shouldShowAdminMenu(): boolean {
    return this.isLoggedIn && this.isAdmin();
  }

  shouldShowUserMenu(): boolean {
    return this.isLoggedIn && this.isUser();
  }

  logout() {
    this.authService.logout();
  }
}