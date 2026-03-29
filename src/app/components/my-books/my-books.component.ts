import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserBook, UserBookItem, UserBooksResponse } from '../../models/user-book.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { BookDetailModalComponent } from '../shared/book-detail-modal/book-detail-modal.component';
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
  private isInitialLoad = true;

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
    // Automatic debounce for searches
    effect(() => {
      const query = this.searchQuery();
      
      // Clear the previous timer
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      
      // Only search if there are 3+ characters or if it's empty (to show all)
      if (query.length === 0 || query.length >= 3) {
        // First load: without delay. Subsequent searches: with debounce
        const delay = this.isInitialLoad ? 0 : 300;
        
        this.searchDebounceTimer = setTimeout(() => {
          this.isInitialLoad = false;
          this.currentPage.set(1);
          this.loadBooks();
        }, delay);
      }
    });
  }

  ngOnInit(): void {
    // The initial load is handled automatically by the effect()
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
