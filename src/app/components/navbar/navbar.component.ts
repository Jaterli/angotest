// src/app/components/navbar/navbar.component.ts
import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  constructor(private authService: AuthService) {
    // nothing else required
  }

  // Exponer señales para template
  get isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  // helper para template (signals-compatible)
  isAdmin() {
    return this.authService.isAdmin();
  }

  get userEmail() {
    return this.authService.getUser()?.email;
  }

  logout() {
    this.authService.logout();
  }
}
