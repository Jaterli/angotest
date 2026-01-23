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
  showUserDropdown = signal(false);
  userProfilePic = signal<string | null>(null); // Opcional: para avatar personalizado

  constructor(private authService: AuthService) {}

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    // Tomar iniciales del nombre y apellido
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
    
    // Preferir nombre completo
    if (this.currentUser.first_name && this.currentUser.last_name) {
      return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
    }
    
    // Si no, usar username
    if (this.currentUser.username) {
      return this.currentUser.username;
    }
    
    // Si no, usar email (recortado)
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

  // Exponer señales y propiedades para template
  get isLoggedIn() {
    if (this.authService.currentUser()) { return true }
    return false;
  }

  get currentUser() {
    return this.authService.currentUser();
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

    // Helper para menús específicos
  shouldShowAdminMenu(): boolean {
    return this.isLoggedIn && this.currentUser?.role == 'admin';
  }

  shouldShowUserMenu(): boolean {
    return this.isLoggedIn && this.currentUser?.role != 'admin';
  }

  logout() {
    this.authService.logout();
    this.showUserDropdown.set(false);
    this.showMobileMenu.set(false);    
  }
}