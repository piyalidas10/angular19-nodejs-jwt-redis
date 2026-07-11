import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/auth/services/auth.service';
import { Permission } from '../../core/auth/models/auth.models';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission?: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { label: $localize`:Shell nav|Dashboard link@@shell.nav.dashboard:Dashboard`,  icon: 'dashboard',            route: '/dashboard' },
  { label: $localize`:Shell nav|Users link@@shell.nav.users:Users`,              icon: 'people',               route: '/users',   permission: 'USER_READ'   },
  { label: $localize`:Shell nav|Roles link@@shell.nav.roles:Roles`,              icon: 'admin_panel_settings', route: '/roles',   permission: 'ROLE_MANAGE' },
  { label: $localize`:Shell nav|My Profile link@@shell.nav.profile:My Profile`,  icon: 'person',               route: '/profile'  },
  { label: $localize`:Shell nav|Settings link@@shell.nav.settings:Settings`,     icon: 'settings',             route: '/settings' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule,
    MatButtonModule, MatMenuModule, MatDividerModule, MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './shell.component.html',
  styleUrl:    './shell.component.scss',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly router     = inject(Router);

  isDark = false;

  readonly toggleThemeLabel = $localize`:Shell|Toggle theme tooltip@@shell.btn.toggleTheme:Toggle theme`;

  readonly isMobile = toSignal(
    this.breakpoint.observe(Breakpoints.Handset).pipe(map(r => r.matches)),
    { initialValue: false },
  );

  readonly visibleNavItems = () =>
    NAV_ITEMS.filter(item =>
      !item.permission || this.auth.hasPermission(item.permission),
    );

  logout(): void {
    this.auth.logout().subscribe();
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
  }
}
