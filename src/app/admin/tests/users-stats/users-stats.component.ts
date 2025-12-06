import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStatsService } from '../../../services/user-stats.service';
import { UserStats } from '../../../models/user-stats.model';

@Component({
  selector: 'app-users-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-stats.component.html'
})
export class UsersStatsComponent implements OnInit {
  
  private service = inject(UserStatsService);

  users = signal<UserStats[]>([]);
  loading = signal(true);

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
