import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root' // Disponible globalmente
})
export class SharedUtilsService {
  
  // Opcional: si necesitas endpoints específicos
  private apiUrl = 'http://tu-api.com/api';

  constructor(private http: HttpClient) { }

  // Métodos para datos estáticos
  getSharedPredefinedLevels(): string[] {
    return ['Principiante', 'Intermedio', 'Avanzado'];
  }

  getSharedMainTopics(): string[] {
    return [
      'Ciencias de la Computación',
      'Matemáticas',
      'Historia',
      'Ciencias Naturales',
      'Literatura',
      'Idiomas (Inglés)',
      'Idiomas (Francés)',
      'Derecho',
      'Economía',
      'Cultura General',
      'Deportes'
    ];
  }

  getSharedSubTopics(mainTopic: string): string[] {
    // Puedes definir esto aquí o llamar a una API
    const topicsMap: { [key: string]: string[] } = {
      'Ciencias de la Computación': ['Fundamentos de Programación', 'Estructuras de Datos', 'Bases de Datos', 'Desarrollo Web'],
      'Matemáticas': ['Álgebra', 'Cálculo', 'Estadística', 'Matemáticas Discretas'],
      // ... etc
    };
    return topicsMap[mainTopic] || [];
  }

  // Métodos de formato
  formatTimeTaken(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seg`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes} min ${remainingSeconds > 0 ? `${remainingSeconds} seg` : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h ${remainingMinutes > 0 ? `${remainingMinutes} min` : ''}`;
  }

  formatScore(score: number): string {
    return `${score.toFixed(1)}%`;
  }

  getSharedSortOrderIcon(selectedSortOrder: string): string {
    return selectedSortOrder === 'asc' ? '↑' : '↓';
  }

  getSharedSortOrderLabel(selectedSortOrder: string): string {
    return selectedSortOrder === 'asc' ? 'Ascendente' : 'Descendente';
  }

  // Métodos de colores para UI
  getSharedScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  getSharedScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  }

  getSharedScoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }

  getSharedScoreMessage(score: number): string {
    if (score >= 90) return '¡Excelente!';
    if (score >= 80) return 'Muy bien';
    if (score >= 70) return 'Buen trabajo';
    if (score >= 60) return 'Aprobado';
    if (score >= 50) return 'Necesitas mejorar';
    return 'Requiere repaso';
  }

  getSharedAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (accuracy >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getSharedStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'in_progress': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'abandoned': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getSharedStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'not_started': return 'Por hacer';
      case 'abandoned': return 'Abandonado';
      case 'all': return 'Todos';
      default: return status;
    }
  }

  getSharedStatusBadgeClass(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'not_started':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  
  // Método para obtener resultados con filtros (compartido)
  getSharedUserResults(userId: number, filters?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/results`, { params: filters });
  }


  getSharedLevelBadgeClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'principiante': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'intermedio': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'avanzado': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  sharedFormatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'  
    });
  }

  sharedFormatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // sharedFormatCompleteDateTime(dateString: string): string {
  //   const date = new Date(dateString);
  //   return date.toLocaleTimeString('es-ES', {
  //     day: '2-digit',
  //     month: '2-digit',
  //     year: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     second: '2-digit'
  //   });
  // }

  sharedFormatTimeShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  sharedFormatTime(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs.toFixed(1)}s`;
    }
  }

  getSharedPageNumbers(totalPages: number, currentPage: number): number[] {
    const pages: number[] = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
      }
    }
    
    return pages;
  }

  // Calcular porcentaje de progreso
  sharedCalculateProgress(correct: number, total: number): number {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  // Validar si un test está disponible
  sharedIsTestAvailable(createdAt: Date | string): boolean {
    const today = new Date();
    const date = new Date(createdAt);
    return date <= today;
  }
}