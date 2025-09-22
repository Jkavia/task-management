import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation Header -->
      <nav *ngIf="currentUser" class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">TurboVets Task Manager</h1>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-700">
                <span class="font-medium">{{ currentUser.firstName }} {{ currentUser.lastName }}</span>
                <span class="text-gray-500 ml-2">({{ currentUser.role }})</span>
              </div>
              <div class="text-xs text-gray-500">
                {{ currentUser.company.name }} - {{ currentUser.department.name }}
              </div>
              <button
                (click)="logout()"
                class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get currentUser$() {
    return this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user && !this.isAuthRoute()) {
        this.router.navigate(['/login']);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private isAuthRoute(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }
}
