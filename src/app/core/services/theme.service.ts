import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly darkMode = signal(this.initialValue());

  constructor() {
    effect(() => {
      const enabled = this.darkMode();
      document.documentElement.classList.toggle('dark', enabled);
      localStorage.setItem('restaurant.darkMode', String(enabled));
    });
  }

  setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
  }

  private initialValue(): boolean {
    const saved = localStorage.getItem('restaurant.darkMode');
    if (saved !== null) {
      return saved === 'true';
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
