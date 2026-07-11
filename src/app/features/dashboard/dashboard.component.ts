import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/auth/services/auth.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  stats: { totalUsers: number; activeUsers: number; totalRoles: number; totalPermissions: number };
  recentActivity: { id: number; action: string; user: string; time: string }[];
  apiStatus: { status: string; uptime: number; timestamp: string };
  currentUser: any;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatDividerModule,
    MatChipsModule, MatProgressBarModule, MatListModule,
    MatBadgeModule, SkeletonComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly data    = signal<DashboardData | null>(null);

  statsCards = () => {
    const s = this.data()?.stats;
    if (!s) return [];
    return [
      { label: $localize`:Dashboard|Total users stat@@dashboard.stat.totalUsers:Total Users`,             value: s.totalUsers,       icon: 'people',               colorClass: 'stat-blue'   },
      { label: $localize`:Dashboard|Active users stat@@dashboard.stat.activeUsers:Active Users`,          value: s.activeUsers,      icon: 'person_check',         colorClass: 'stat-green'  },
      { label: $localize`:Dashboard|Total roles stat@@dashboard.stat.totalRoles:Total Roles`,             value: s.totalRoles,       icon: 'admin_panel_settings', colorClass: 'stat-orange' },
      { label: $localize`:Dashboard|Total permissions stat@@dashboard.stat.totalPermissions:Total Permissions`, value: s.totalPermissions, icon: 'lock_open',       colorClass: 'stat-purple' },
    ];
  };

  ngOnInit(): void {
    this.http
      .get<DashboardData>(`${environment.apiUrl}/dashboard`, { withCredentials: true })
      .subscribe({
        next:  (data: DashboardData) => { this.data.set(data); this.loading.set(false); },
        error: ()   => this.loading.set(false),
      });
  }

  formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
}
