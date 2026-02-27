export interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn13: string;
  isbn10: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookItem {
  type: 'books';
  id: string;
  attributes: Book;
}

export interface BooksResponse {
  results: BookItem[];
  paginationInfo: {
    skip: number;
    limit: number;
    total: number;
  };
}

export interface ExternalBook {
  title: string;
  authors: string[];
  isbn13: string;
  isbn10: string;
  coverUrl: string;
}

export interface ExternalBookResponse {
  results: {
    type: 'book-result';
    attributes: ExternalBook;
  };
}

export interface AddBookToLibraryDto {
  isbn: string;
  rating?: number | null;
  notes?: string | null;
}
