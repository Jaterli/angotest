import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStatsService } from '../../../services/user-stats.service';
import { UserStats } from '../../../models/user-stats.model';
import { RouterModule } from '@angular/router';
import { 
  FaIconLibrary, 
  FontAwesomeModule // ← AÑADIR ESTO
} from '@fortawesome/angular-fontawesome';
import { 
  faEye, 
  faClipboardCheck 
  // Remover faFileAlt y faUserCircle si no se usan
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-users-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule // ← AÑADIR ESTO
  ],
  templateUrl: './users-stats.component.html'
})
export class UsersStatsComponent implements OnInit {
  
  private service = inject(UserStatsService);

  users = signal<UserStats[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  
  // Variables para los iconos (se usan en el template)
  faEye = faEye;
  faClipboardCheck = faClipboardCheck;

  constructor(library: FaIconLibrary) {
    library.addIcons(faEye, faClipboardCheck);
  }

  // Columnas para la tabla (esto ya no se usa en el template HTML, 
  // pero lo mantengo por si lo necesitas para otra cosa)
  displayedColumns: string[] = [
    'id', 
    'username', 
    'email', 
    'role', 
    'created_at', 
    'tests_finished', 
    'actions'
  ];

  // Método para obtener el color según el rol
  getRoleClasses(role: string): string {
    const roleLower = role.toLowerCase();
    
    if (roleLower === 'admin') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    } else if (roleLower === 'user') {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    } else if (roleLower === 'editor') {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
    } else if (roleLower === 'moderator') {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    } else {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  // Métodos de utilidad para la paginación
  getStartIndex(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, this.users().length);
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.users().length / this.pageSize());
    const pages: number[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() * this.pageSize() < this.users().length) {
      this.currentPage.update(page => page + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  ngOnInit() {
    this.service.getUsersStats().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}