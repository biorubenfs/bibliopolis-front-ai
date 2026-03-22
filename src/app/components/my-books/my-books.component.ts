import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserBook, UserBookItem, UserBooksResponse } from '../../models/user-book.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { BookDetailModalComponent } from '../library-books/book-detail-modal/book-detail-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-books',
  imports: [NavbarComponent, PaginationComponent, BookDetailModalComponent, FormsModule],
  templateUrl: './my-books.component.html',
  styleUrl: './my-books.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyBooksComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  books = signal<UserBook[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  searchQuery = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(25);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  // Modal
  showDetailModal = signal<boolean>(false);
  selectedBook = signal<UserBook | null>(null);

  constructor() {
    // Debounce automático para búsquedas
    effect(() => {
      const query = this.searchQuery();
      
      // Limpiar el timer anterior
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      
      // Solo buscar si hay 3+ caracteres o si está vacío (para mostrar todos)
      if (query.length === 0 || query.length >= 3) {
        this.searchDebounceTimer = setTimeout(() => {
          this.currentPage.set(1);
          this.loadBooks();
        }, 1000);
      }
    });
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const skip = (this.currentPage() - 1) * this.itemsPerPage();
    const limit = this.itemsPerPage();
    const search = this.searchQuery();

    this.userService.getUserBooks(skip, limit, search).subscribe({
      next: (response: UserBooksResponse) => {
        this.books.set(
          response.results.map((item: UserBookItem) => ({
            ...item.attributes,
            id: item.id
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

  onBookUpdated(): void {
    this.loadBooks();
  }

  onBookRemoved(): void {
    this.closeDetailModal();
    this.loadBooks();
  }
}
