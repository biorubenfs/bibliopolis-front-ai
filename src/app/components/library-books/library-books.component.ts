import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, takeWhile, catchError, EMPTY } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { JobService } from '../../services/job.service';
import { UserBook } from '../../models/user-book.model';
import { Job } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { BookDetailModalComponent } from '../shared/book-detail-modal/book-detail-modal.component';
import { AddBookModalComponent } from './add-book-modal/add-book-modal.component';
import { RemoveBookModalComponent } from './remove-book-modal/remove-book-modal.component';
import { UserBookCardComponent } from '../shared/user-book-card/user-book-card.component';
import { LucideAngularModule, AlertTriangle, CheckCircle, XCircle, X, Copy, FileText, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-library-books',
  imports: [NavbarComponent, RouterLink, PaginationComponent, BookDetailModalComponent, AddBookModalComponent, RemoveBookModalComponent, UserBookCardComponent, LucideAngularModule],
  templateUrl: './library-books.component.html',
  styleUrl: './library-books.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryBooksComponent implements OnInit {
  readonly icons = { AlertTriangle, CheckCircle, XCircle, X, Copy, FileText, ChevronDown };

  libraryName = signal<string>('');
  libraryDescription = signal<string>('');
  private libraryService = inject(LibraryService);
  private jobService = inject(JobService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  libraryId = signal<string>('');
  books = signal<UserBook[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(25);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  // Modals
  showDetailModal = signal<boolean>(false);
  selectedBook = signal<UserBook | null>(null);
  showAddBookModal = signal<boolean>(false);
  showRemoveBookModal = signal<boolean>(false);
  bookToRemove = signal<UserBook | null>(null);

  // Import job
  importJob = signal<Job | null>(null);
  showImportJobModal = signal<boolean>(false);
  showSkippedList = signal<boolean>(false);
  showFailedList = signal<boolean>(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.libraryId.set(id);
      this.libraryService.getLibrary(id).subscribe({
        next: (response) => {
          const attrs = response.results.attributes;
          this.libraryName.set(attrs.name);
          this.libraryDescription.set(attrs.description);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        }
      });
      this.loadBooks();
      this.loadImportJob(id);
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

  private loadImportJob(libraryId: string): void {
    this.jobService.getJobsByResource(libraryId, 'library_csv_import').subscribe({
      next: (response) => {
        if (response.results.length === 0) return;

        const item = response.results[0];
        const job: Job = { ...item.attributes, id: item.id };
        this.importJob.set(job);

        const isTerminal = job.status === 'completed' || job.status === 'failed';
        if (!isTerminal) {
          this.startJobPolling(job.id);
        }
      }
    });
  }

  private startJobPolling(jobId: string): void {
    interval(3000).pipe(
      switchMap(() =>
        this.jobService.getJob(jobId).pipe(catchError(() => EMPTY))
      ),
      takeWhile(
        (response) => {
          const status = response.results.attributes.status;
          return status === 'pending' || status === 'in_progress';
        },
        true
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        const item = response.results;
        const job: Job = { ...item.attributes, id: item.id };
        this.importJob.set(job);

        if (job.status === 'completed' || job.status === 'failed') {
          this.loadBooks();
        }
      }
    });
  }

  openImportJobModal(): void {
    this.showImportJobModal.set(true);
  }

  closeImportJobModal(): void {
    this.showImportJobModal.set(false);
  }

  toggleSkippedList(): void {
    this.showSkippedList.update(v => !v);
  }

  toggleFailedList(): void {
    this.showFailedList.update(v => !v);
  }

  copySkippedIsbns(): void {
    const skipped = this.importJob()?.report?.skipped ?? [];
    navigator.clipboard.writeText(skipped.join('\n'));
  }

  copyFailedIsbns(): void {
    const failed = this.importJob()?.report?.failed ?? [];
    navigator.clipboard.writeText(failed.join('\n'));
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

  openAddBookModal(): void {
    this.showAddBookModal.set(true);
  }

  closeAddBookModal(): void {
    this.showAddBookModal.set(false);
  }

  onBookAdded(): void {
    this.closeAddBookModal();
    this.loadBooks();
  }

  onRemoveBook(book: UserBook): void {
    this.bookToRemove.set(book);
    this.showRemoveBookModal.set(true);
  }

  closeRemoveBookModal(): void {
    this.showRemoveBookModal.set(false);
    this.bookToRemove.set(null);
  }

  onBookRemovedFromList(): void {
    this.closeRemoveBookModal();
    this.loadBooks();
  }
}
