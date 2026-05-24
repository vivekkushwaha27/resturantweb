import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterOtpRequest, UserProfile, UserRole, VerifyRegistrationRequest } from '../models/api.models';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'restaurant.token';
  private readonly userKey = 'restaurant.user';

  readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly user = signal<UserProfile | null>(this.readUser());
  readonly isAuthenticated = computed(() => !!this.token() && !!this.user());

  requestOtp(request: RegisterOtpRequest) {
    return this.api.requestRegistrationOtp(request);
  }

  verifyRegistration(request: VerifyRegistrationRequest) {
    return this.api.verifyRegistration(request).pipe(tap((response) => this.setSession(response)));
  }

  login(request: LoginRequest) {
    return this.api.login(request).pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.token.set(null);
    this.user.set(null);
    this.router.navigateByUrl('/auth');
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const role = this.user()?.role;
    return !!role && roles.includes(role);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.token.set(response.token);
    this.user.set(response.user);
  }

  private readUser(): UserProfile | null {
    try {
      const value = localStorage.getItem(this.userKey);
      return value ? JSON.parse(value) as UserProfile : null;
    } catch {
      return null;
    }
  }
}
