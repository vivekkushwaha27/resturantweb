import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/api.models';
import { AuthStore } from '../services/auth-store.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth'], { queryParams: { returnUrl: state.url } });
  }

  const roles = route.data['roles'] as UserRole[] | undefined;
  if (roles?.length && !auth.hasAnyRole(roles)) {
    return router.createUrlTree(['/menu']);
  }

  return true;
};
