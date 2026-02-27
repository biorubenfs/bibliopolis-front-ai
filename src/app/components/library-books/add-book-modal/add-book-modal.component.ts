import { Component, ChangeDetectionStrategy, inject, output, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../services/book.service';
import { LibraryService } from '../../../services/library.service';
import { ExternalBook } from '../../../models/book.model';

@Component({
  selector: 'app-add-book-modal',
  imports: [FormsModule],
  templateUrl: './add-book-modal.component.html',
  styleUrl: './add-book-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddBookModalComponent {
  private bookService = inject(BookService);
  private libraryService = inject(LibraryService);

  libraryId = input.required<string>();
  closeModal = output<void>();
  bookAdded = output<void>();

  isbn = signal<string>('');
  isSearching = signal<boolean>(false);
  isAdding = signal<boolean>(false);
  errorMessage = signal<string>('');
  searchPerformed = signal<boolean>(false);
  foundBook = signal<ExternalBook | null>(null);

  onClose(): void {
    this.closeModal.emit();
  }

  onSearch(): void {
    const isbnValue = this.isbn().trim();
    
    if (!isbnValue) {
      this.errorMessage.set('Por favor introduce un ISBN');
      return;
    }

    this.isSearching.set(true);
    this.errorMessage.set('');
    this.searchPerformed.set(true);
    this.foundBook.set(null);

    this.bookService.searchExternalBook(isbnValue).subscribe({
      next: (response) => {
        this.foundBook.set(response.results.attributes);
        this.isSearching.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSearching.set(false);
        this.foundBook.set(null);
      }
    });
  }

  onAddBook(): void {
    const book = this.foundBook();
    if (!book) return;

    this.isAdding.set(true);
    this.errorMessage.set('');

    const data = {
      isbn: book.isbn13 || book.isbn10
    };

    this.libraryService.addBookToLibrary(this.libraryId(), data).subscribe({
      next: () => {
        this.isAdding.set(false);
        this.bookAdded.emit();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isAdding.set(false);
      }
    });
  }

  getAuthorsText(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Autor desconocido';
    return authors.join(', ');
  }
}
