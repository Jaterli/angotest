import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // Disponible globalmente
})
export class SharedUtilsService {
  

  constructor() { }

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
    return `${score % 1 === 0 ? score : score.toFixed(2)}%`;
  }

  getSharedSortOrderIcon(selectedSortOrder: string): string {
    return selectedSortOrder === 'asc' ? '↑' : '↓';
  }

  getSharedSortOrderLabel(selectedSortOrder: string): string {
    return selectedSortOrder === 'asc' ? 'Ascendente' : 'Descendente';
  }

  // Métodos de colores para UI
  getSharedScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-lime-600 dark:text-lime-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    if (score >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getSharedScoreBgColor(score: number): string {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 80) return 'bg-lime-100 dark:bg-lime-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/30';
    if (score >= 20) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  }

  getSharedScoreBadgeClass(score: number): string {
    var commonClasses = 'inline-flex px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ';
    if (score >= 90) return commonClasses + 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';     
    if (score >= 80) return commonClasses + 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300';
    if (score >= 60) return commonClasses + 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    if (score >= 40) return commonClasses + 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    if (score >= 20) return commonClasses + 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return commonClasses + 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
  getSharedProgressColor(score: number): string {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-lime-600 dark:text-lime-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    if (score >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getSharedProgressBarEmpty() {
      return 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'
  }

  getSharedProgressBarColor(progress: number): string {
    var commonClasses = 'h-2 rounded-full transition-all duration-500 ';
    if (progress >= 90) return commonClasses + 'bg-green-300 dark:bg-green-500';
    if (progress >= 80) return commonClasses + 'bg-lime-300 dark:bg-lime-500';
    if (progress >= 60) return commonClasses + 'bg-yellow-300 dark:bg-yellow-500';
    if (progress >= 40) return commonClasses + 'bg-amber-300 dark:bg-amber-500';
    if (progress >= 20) return commonClasses + 'bg-orange-300 dark:bg-orange-500';
    return commonClasses + 'bg-red-300 dark:bg-red-500';    
  }

  getSharedAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 80) return 'text-lime-600 dark:text-lime-400';
    if (accuracy >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (accuracy >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getSharedScoreMessage(score: number): string {    
    if (score >= 100) return '¡Perfecto! 🏆';
    if (score >= 90) return '¡Excelente! ⭐';    
    if (score >= 80) return '¡Muy bien! 👍';
    if (score >= 70) return 'Buen trabajo 💪';
    if (score >= 60) return 'Bien ✅';
    if (score >= 50) return 'Aprobado 📚';
    if (score >= 40) return 'A mejorar 🔄';
    if (score >= 30) return 'Sigue practicando 📝';    
    return 'Requiere repaso 📖';
  }


  getSharedMedalIcon(position: number): string {
    if (position == 1) return '🥇';
    if (position == 2) return '🥈';
    if (position == 3) return '🥉';
    return '';
  }

  getSharedRoleBadgeClass(role: string): string {
    var commonClasses = 'inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ';
    if (role == 'user') return commonClasses + 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300';
    if (role == 'admin') return commonClasses + 'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300';
    if (role == 'guest') return commonClasses + 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300';
    if (role == 'deleted') return commonClasses + 'bg-gray-300 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    return commonClasses + 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
  }

  getSharedStatusBadgeClass(status: string): string {
    var commonClasses = 'inline-flex px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ';
    switch(status) {
      case 'completed': 
        case 'used':
          return commonClasses + 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'in_progress':
        case 'active':
          return commonClasses + 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'expired':
          return commonClasses + 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return commonClasses + 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }


  getSharedStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'not_started': return 'Por hacer';
      case 'expired': return 'Expirado';
      case 'all': return 'Todos';
      default: return status;
    }
  }

  getSharedActivityStatusBgColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'expired':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  }

  getSharedLevelBadgeClass(level: string): string {
    var commonClasses = 'inline-flex px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ';
    switch (level?.toLowerCase()) {
      case 'principiante': return commonClasses + 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
      case 'intermedio': return commonClasses + 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'avanzado': return commonClasses + 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return commonClasses + 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getSharedBooleanBadgeClass(param: boolean): string {
    return param 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }

  sharedFormatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit', // 'numeric'  
    });
  }

  sharedFormatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit', // 'numeric'  
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  sharedFormatTimeShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  sharedFormatTime(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';
    if (seconds < 60) {
      return `${seconds.toFixed(0)}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
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

  sharedCalculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  }

  // Validar si un test está disponible
  sharedIsTestAvailable(createdAt: Date | string): boolean {
    const today = new Date();
    const date = new Date(createdAt);
    return date <= today;
  }

}