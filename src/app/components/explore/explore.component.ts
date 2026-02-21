import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-explore',
  imports: [NavbarComponent, PaginationComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExploreComponent implements OnInit {
  private bookService = inject(BookService);

  books = signal<Book[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(25);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const skip = (this.currentPage() - 1) * this.itemsPerPage();
    const limit = this.itemsPerPage();

    this.bookService.getBooks(skip, limit).subscribe({
      next: (response) => {
        this.books.set(
          response.results.map(item => ({
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
    this.currentPage.set(1); // Reset to first page
    this.loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getAuthorsText(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Autor desconocido';
    return authors.join(', ');
  }
}
