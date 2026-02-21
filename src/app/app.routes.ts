import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/libraries',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'libraries',
    canActivate: [authGuard],
    loadComponent: () => import('./components/libraries/libraries.component').then(m => m.LibrariesComponent)
  },
  {
    path: 'libraries/:id/books',
    canActivate: [authGuard],
    loadComponent: () => import('./components/library-books/library-books.component').then(m => m.LibraryBooksComponent)
  },
  {
    path: '**',
    redirectTo: '/libraries'
  }
];
