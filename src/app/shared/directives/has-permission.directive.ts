import {
  Directive, Input, OnInit, TemplateRef, ViewContainerRef, inject
} from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { Permission } from '../../core/auth/models/auth.models';

/**
 * Structural directive — shows content only when the authenticated user
 * has the specified permission.
 *
 * Usage:
 *   <button *hasPermission="'USER_WRITE'">Create User</button>
 *   <div *hasPermission="['USER_READ', 'REPORT_VIEW']">Reports</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  @Input('hasPermission') permission!: Permission | Permission[];

  private readonly auth = inject(AuthService);
  private readonly tpl  = inject(TemplateRef<unknown>);
  private readonly vcr  = inject(ViewContainerRef);

  ngOnInit(): void {
    const perms = Array.isArray(this.permission) ? this.permission : [this.permission];
    const allowed = perms.some(p => this.auth.hasPermission(p));

    if (allowed) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}
