import { Component, ChangeDetectionStrategy, inject, output, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { BookService } from '../../../services/book.service';
import { LibraryService } from '../../../services/library.service';
import { ExternalBook } from '../../../models/book.model';

@Component({
  selector: 'app-add-book-modal',
  imports: [FormsModule, ZXingScannerModule],
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
  
  isScannerActive = signal<boolean>(false);
  scannerError = signal<string>('');
  hasPermission = signal<boolean | null>(null);
  
  // Formatos de código de barras soportados para ISBN
  allowedFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];

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

  toggleScanner(): void {
    this.isScannerActive.update(value => !value);
    this.scannerError.set('');
    
    if (!this.isScannerActive()) {
      this.hasPermission.set(null);
    }
  }

  onScanSuccess(result: string): void {
    if (result) {
      // Extraer solo los dígitos del código de barras
      const cleanIsbn = result.replace(/\D/g, '');
      
      if (cleanIsbn.length === 10 || cleanIsbn.length === 13) {
        this.isbn.set(cleanIsbn);
        this.isScannerActive.set(false);
        this.scannerError.set('');
        
        // Buscar automáticamente después de escanear
        this.onSearch();
      } else {
        this.scannerError.set('Código de barras no válido. Debe ser ISBN-10 o ISBN-13.');
      }
    }
  }

  onScanError(error: Error): void {
    console.error('Error en el escáner:', error);
    this.scannerError.set('Error al acceder a la cámara. Verifica los permisos.');
  }

  onPermissionResponse(hasPermission: boolean): void {
    this.hasPermission.set(hasPermission);
    
    if (!hasPermission) {
      this.scannerError.set('Se necesitan permisos de cámara para escanear códigos de barras.');
      this.isScannerActive.set(false);
    }
  }
}
