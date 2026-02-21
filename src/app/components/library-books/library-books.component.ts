import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LibraryService } from '../../services/library.service';
import { UserBook } from '../../models/user-book.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-library-books',
  imports: [NavbarComponent, DatePipe, RouterLink],
  templateUrl: './library-books.component.html',
  styleUrl: './library-books.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryBooksComponent implements OnInit {
  private libraryService = inject(LibraryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  libraryId = signal<string>('');
  books = signal<UserBook[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.libraryId.set(id);
      this.loadBooks();
    } else {
      this.router.navigate(['/libraries']);
    }
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.libraryService.getLibraryBooks(this.libraryId()).subscribe({
      next: (response) => {
        this.books.set(
          response.results.map(item => item.attributes)
        );
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
    });
  }

  getRatingStars(rating: number | null): boolean[] {
    const stars: boolean[] = [];
    const ratingValue = rating || 0;
    for (let i = 0; i < 10; i++) {
      stars.push(i < ratingValue);
    }
    return stars;
  }

  getAuthorsText(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Autor desconocido';
    return authors.join(', ');
  }
}
