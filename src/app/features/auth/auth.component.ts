import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL_IMPORTS } from '../../shared/material-imports';
import { AuthStore } from '../../core/services/auth-store.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly otpRequested = signal(false);
  protected readonly developmentOtp = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    defaultAddress: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  protected login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.afterAuth(),
      error: (error) => this.showError(error),
    });
  }

  protected requestOtp(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.requestOtp(this.registerForm.getRawValue()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.otpRequested.set(true);
        this.developmentOtp.set(response.developmentOtp ?? null);
        this.snackBar.open(response.message, 'OK', { duration: 3500 });
      },
      error: (error) => this.showError(error),
    });
  }

  protected verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.verifyRegistration({
      email: this.registerForm.controls.email.value,
      otp: this.otpForm.controls.otp.value,
    }).subscribe({
      next: () => this.afterAuth(),
      error: (error) => this.showError(error),
    });
  }

  private afterAuth(): void {
    this.loading.set(false);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/menu';
    this.router.navigateByUrl(returnUrl);
  }

  private showError(error: unknown): void {
    this.loading.set(false);
    const message = typeof error === 'object' && error && 'error' in error
      ? ((error as { error?: { error?: string } }).error?.error ?? 'Something went wrong.')
      : 'Something went wrong.';
    this.error.set(message);
    this.snackBar.open(message, 'Close', { duration: 4000 });
  }
}
