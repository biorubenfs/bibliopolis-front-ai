import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { Library } from '../../models/library.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-libraries',
  imports: [NavbarComponent, DatePipe, RouterLink],
  templateUrl: './libraries.component.html',
  styleUrl: './libraries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibrariesComponent implements OnInit {
  private libraryService = inject(LibraryService);

  libraries = signal<Library[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadLibraries();
  }

  loadLibraries(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.libraryService.getLibraries().subscribe({
      next: (response) => {
        this.libraries.set(
          response.results.map(item => ({
            ...item.attributes,
            id: item.id
          }))
        );
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
    });
  }
}
