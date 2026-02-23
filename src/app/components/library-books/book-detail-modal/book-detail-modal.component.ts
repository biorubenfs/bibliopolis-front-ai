import { Component, ChangeDetectionStrategy, inject, output, signal, input, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../../services/library.service';
import { BookService } from '../../../services/book.service';
import { UserBook } from '../../../models/user-book.model';

@Component({
  selector: 'app-book-detail-modal',
  imports: [FormsModule],
  templateUrl: './book-detail-modal.component.html',
  styleUrl: './book-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailModalComponent {
  private libraryService = inject(LibraryService);
  private bookService = inject(BookService);

  book = input.required<UserBook>();
  libraryId = input.required<string>();
  closeModal = output<void>();
  bookRemoved = output<void>();
  bookUpdated = output<void>();

  isDeleting = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Editable fields
  editableRating = signal<number | null>(null);
  editableNotes = signal<string>('');
  hoveredStar = signal<number | null>(null);

  maxNotesLength = 150;

  notesRemaining = computed(() => {
    return this.maxNotesLength - this.editableNotes().length;
  });

  hasChanges = computed(() => {
    return this.editableRating() !== this.book().rating || 
           this.editableNotes() !== (this.book().notes || '');
  });

  constructor() {
    effect(() => {
      // Initialize editable fields when book changes
      const currentBook = this.book();
      this.editableRating.set(currentBook.rating);
      this.editableNotes.set(currentBook.notes || '');
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onRemoveFromLibrary(): void {
    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.libraryService.removeBookFromLibrary(this.libraryId(), this.book().id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.bookRemoved.emit();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isDeleting.set(false);
      }
    });
  }

  onSaveChanges(): void {
    if (!this.hasChanges()) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const updateData = {
      rating: this.editableRating(),
      notes: this.editableNotes() || null
    };

    this.bookService.updateUserBook(this.book().id, updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Cambios guardados correctamente');
        this.bookUpdated.emit();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSaving.set(false);
      }
    });
  }

  setRating(rating: number): void {
    if (this.editableRating() === rating) {
      this.editableRating.set(null);
    } else {
      this.editableRating.set(rating);
    }
  }

  onStarHover(star: number | null): void {
    this.hoveredStar.set(star);
  }

  isStarActive(index: number): boolean {
    const hovered = this.hoveredStar();
    const rating = this.editableRating();
    
    if (hovered !== null) {
      return index < hovered;
    }
    
    return rating !== null && index < rating;
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
