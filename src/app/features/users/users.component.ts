import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { environment } from '../../../environments/environment';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { User } from '../../core/auth/models/auth.models';
import { UserDialogComponent } from './user-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatSelectModule, MatDialogModule, MatTooltipModule,
    MatProgressBarModule, MatMenuModule,
    SkeletonComponent, HasPermissionDirective,
  ],
  templateUrl: './users.component.html',
  styleUrl:    './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly http   = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  readonly loading    = signal(true);
  readonly searchTerm = signal('');
  readonly roleFilter = signal('');

  displayedColumns = ['avatar', 'name', 'email', 'department', 'role', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatSort)      set matSort(s: MatSort)           { this.dataSource.sort      = s; }
  @ViewChild(MatPaginator) set matPaginator(p: MatPaginator) { this.dataSource.paginator = p; }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.http
      .get<{ data: User[] }>(`${environment.apiUrl}/users`, { withCredentials: true })
      .subscribe({
        next:  res => { this.dataSource.data = res.data; this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.dataSource.filter = value.trim().toLowerCase();
  }

  onRoleFilter(role: string): void {
    this.roleFilter.set(role);
    this.loadUsersWithFilter();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set('');
    this.dataSource.filter = '';
    this.loadUsers();
  }

  openCreate(): void {
    const ref = this.dialog.open(UserDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  openEdit(user: User): void {
    const ref = this.dialog.open(UserDialogComponent, { width: '500px', data: user });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  deleteUser(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:   $localize`:Users dialog|Delete confirm title@@users.deleteDialog.title:Delete User`,
        message: $localize`:Users dialog|Delete confirm message@@users.deleteDialog.message:Delete ${user.firstName} ${user.lastName}?`,
      },
    });
    const closeText = $localize`:Global|Snackbar close action@@global.snack.close:Close`;
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.http
        .delete(`${environment.apiUrl}/users/${user.id}`, { withCredentials: true })
        .subscribe({
          next:  () => {
            this.snack.open(
              $localize`:Users|Deleted snackbar@@users.snack.deleted:User deleted.`,
              closeText, { duration: 3000 },
            );
            this.loadUsers();
          },
          error: () => this.snack.open(
            $localize`:Users|Delete error snackbar@@users.snack.deleteFailed:Failed to delete user.`,
            closeText, { duration: 3000 },
          ),
        });
    });
  }

  private loadUsersWithFilter(): void {
    const role = this.roleFilter();
    const url  = role
      ? `${environment.apiUrl}/users?role=${role}`
      : `${environment.apiUrl}/users`;

    this.loading.set(true);
    this.http.get<{ data: User[] }>(url, { withCredentials: true }).subscribe({
      next:  res => { this.dataSource.data = res.data; this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
