import { Component, ChangeDetectionStrategy, inject, output, signal, input, computed } from '@angular/core';
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
  bookNotFound = signal<boolean>(false);
  
  isScannerActive = signal<boolean>(false);
  scannerError = signal<string>('');
  hasPermission = signal<boolean | null>(null);
  
  // Manual entry mode
  manualEntryMode = signal<boolean>(false);
  manualBook = signal({
    title: '',
    isbn: '',
    authors: '',
    cover: null as { source: null; value: null; } | null
  });
  
  // Formatos de código de barras soportados para ISBN
  allowedFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];

  // Computed validation state
  isManualFormValid = computed(() => {
    const book = this.manualBook();
    const hasTitle = book.title.trim().length > 0;
    const hasIsbn = book.isbn.trim().length > 0;
    const hasAuthors = book.authors.trim().length > 0;
    return hasTitle && hasIsbn && hasAuthors;
  });

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
    this.bookNotFound.set(false);

    this.bookService.searchExternalBook(isbnValue).subscribe({
      next: (response) => {
        this.foundBook.set(response.results.attributes);
        this.isSearching.set(false);
        this.bookNotFound.set(false);
      },
      error: (error: Error) => {
        this.isSearching.set(false);
        this.foundBook.set(null);
        
        // Check if it's a "not found" error
        if (error.message.toLowerCase().includes('not found')) {
          this.bookNotFound.set(true);
          this.errorMessage.set('');
        } else {
          this.errorMessage.set(error.message);
          this.bookNotFound.set(false);
        }
      }
    });
  }

  onAddBook(): void {
    const book = this.foundBook();
    if (!book) return;

    this.isAdding.set(true);
    this.errorMessage.set('');

    const data = {
      title: book.title,
      isbn13: book.isbn13,
      isbn10: book.isbn10,
      authors: book.authors,
      cover: book.cover 
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

  enableManualEntry(): void {
    this.manualEntryMode.set(true);
    this.errorMessage.set('');
    // Pre-fill ISBN if already searched
    const searchedIsbn = this.isbn().trim();
    if (searchedIsbn) {
      this.manualBook.update(book => ({ ...book, isbn: searchedIsbn }));
    }
  }

  updateManualTitle(title: string): void {
    this.manualBook.update(book => ({ ...book, title }));
  }

  updateManualIsbn(isbn: string): void {
    this.manualBook.update(book => ({ ...book, isbn }));
  }

  updateManualAuthors(authors: string): void {
    this.manualBook.update(book => ({ ...book, authors }));
  }

  cancelManualEntry(): void {
    this.manualEntryMode.set(false);
    this.manualBook.set({
      title: '',
      isbn: '',
      authors: '',
      cover: null
    });
    this.errorMessage.set('');
    // Keep bookNotFound state so user can see the manual entry button again
  }

  onAddManualBook(): void {
    const book = this.manualBook();
    
    // Validate ISBN
    const isbn = book.isbn.trim();

    if (!isbn) {
      this.errorMessage.set('Debe proporcionar un ISBN');
      return;
    }

    // Remove any hyphens or spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    let isbn13: string | null = null;
    let isbn10: string | null = null;

    // Determine if it's ISBN-10 or ISBN-13 based on length
    if (cleanIsbn.length === 13) {
      if (!this.isValidIsbn13(cleanIsbn)) {
        this.errorMessage.set('El ISBN-13 no es válido. Debe contener 13 dígitos válidos.');
        return;
      }
      isbn13 = cleanIsbn;
    } else if (cleanIsbn.length === 10) {
      if (!this.isValidIsbn10(cleanIsbn)) {
        this.errorMessage.set('El ISBN-10 no es válido. Debe contener 10 caracteres válidos.');
        return;
      }
      isbn10 = cleanIsbn;
    } else {
      this.errorMessage.set('El ISBN debe tener 10 o 13 dígitos.');
      return;
    }

    // Parse authors
    const authorsArray = book.authors
      .split(',')
      .map(author => author.trim())
      .filter(author => author.length > 0);

    if (authorsArray.length === 0) {
      this.errorMessage.set('Debe proporcionar al menos un autor');
      return;
    }

    this.isAdding.set(true);
    this.errorMessage.set('');

    const data = {
      title: book.title.trim(),
      isbn13,
      isbn10,
      authors: authorsArray,
      cover: {
        source: null,
        value: null
      }
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

  private isValidIsbn13(isbn: string): boolean {
    // Remove any hyphens or spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    
    // Must be exactly 13 digits
    if (!/^\d{13}$/.test(cleanIsbn)) {
      return false;
    }

    // Validate checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(cleanIsbn[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleanIsbn[12], 10);
  }

  private isValidIsbn10(isbn: string): boolean {
    // Remove any hyphens or spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    
    // Must be exactly 10 characters (9 digits + checksum which can be X)
    if (!/^\d{9}[\dX]$/i.test(cleanIsbn)) {
      return false;
    }

    // Validate checksum
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanIsbn[i], 10) * (10 - i);
    }
    const checkChar = cleanIsbn[9].toUpperCase();
    const checkValue = checkChar === 'X' ? 10 : parseInt(checkChar, 10);
    sum += checkValue;
    
    return sum % 11 === 0;
  }

  private doIsbnsMatch(isbn13: string, isbn10: string): boolean {
    // Convert ISBN-10 to ISBN-13 and compare
    const cleanIsbn10 = isbn10.replace(/[-\s]/g, '');
    const cleanIsbn13 = isbn13.replace(/[-\s]/g, '');
    
    // ISBN-13 from ISBN-10: 978 + first 9 digits of ISBN-10 + new checksum
    const prefix = '978';
    const base = prefix + cleanIsbn10.substring(0, 9);
    
    // Calculate ISBN-13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const convertedIsbn13 = base + checkDigit;
    
    return convertedIsbn13 === cleanIsbn13;
  }
}
