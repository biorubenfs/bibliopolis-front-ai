import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { UserBook } from '../../models/user-book.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { BookDetailModalComponent } from './book-detail-modal/book-detail-modal.component';

@Component({
  selector: 'app-library-books',
  imports: [NavbarComponent, RouterLink, PaginationComponent, BookDetailModalComponent],
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
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(25);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  // Modal
  showDetailModal = signal<boolean>(false);
  selectedBook = signal<UserBook | null>(null);

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

    const skip = (this.currentPage() - 1) * this.itemsPerPage();
    const limit = this.itemsPerPage();

    this.libraryService.getLibraryBooks(this.libraryId(), skip, limit).subscribe({
      next: (response) => {
        this.books.set(
          response.results.map(item => ({
            ...item.attributes,
            id: item.id // Usar el id del item, no del attributes
          }))
        );
        this.totalItems.set(response.paginationInfo.total);
        this.totalPages.set(Math.ceil(response.paginationInfo.total / this.itemsPerPage()));
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onItemsPerPageChange(newSize: number): void {
    this.itemsPerPage.set(newSize);
    this.currentPage.set(1);
    this.loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  openDetailModal(book: UserBook): void {
    this.selectedBook.set(book);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedBook.set(null);
  }

  onBookRemoved(): void {
    this.closeDetailModal();
    this.loadBooks();
  }

  onBookUpdated(): void {
    this.loadBooks();
  }

  onRemoveBook(event: Event, book: UserBook): void {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de que deseas eliminar "${book.bookTitle}" de esta biblioteca?`)) {
      this.libraryService.removeBookFromLibrary(this.libraryId(), book.id).subscribe({
        next: () => {
          this.loadBooks();
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        }
      });
    }
  }
}
