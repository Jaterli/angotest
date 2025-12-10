import { Component, signal, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

import { DatePipe } from '@angular/common';
import { Result } from '../../models/test.model';
@Component({
  standalone: true,
  selector: 'app-user-details',
  imports: [
    CommonModule,
    DatePipe
   ],
  templateUrl: './user-details.component.html',
})
export class UserDetailsComponent {

  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  loading = signal(true);
  user = signal<any | null>(null);
  
  // Columnas para la tabla de Material
  displayedColumns: string[] = ['test', 'correct_answers', 'time_taken', 'created_at', 'actions'];

  // Método opcional para ver detalles
  viewResultDetails(result: any) {
    console.log('Ver detalles del resultado:', result);
    // Implementar un diálogo o navegación aquí
  }

  constructor() {
    effect(() => {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.fetchUser(id);
    });
  }


  getAverageScore(): number {
    if (!this.user() || !this.user().results || this.user().results.length === 0) {
      return 0;
    }
    
    const totalScore = this.user().results.reduce((sum: number, result: Result) => {
      return sum + (result.correct_answers / result.total * 100);
    }, 0);
    
    return totalScore / this.user().results.length;
  }

  getTotalTime(): number {
    if (!this.user() || !this.user().results || this.user().results.length === 0) {
      return 0;
    }
    
    const totalSeconds = this.user().results.reduce((sum: number, result: Result) => {
      return sum + result.time_taken;
    }, 0);
    
    // Convertir a minutos
    return totalSeconds / 60;
  }

  fetchUser(id: number) {
    this.loading.set(true);
    this.userService.getUserDetails(id).subscribe({
      next: (res) => {
        this.user.set(res.user);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
