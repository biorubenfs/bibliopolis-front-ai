export interface Library {
  id: string;
  name: string;
  description: string;
  userId: string;
  books: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  type: 'libraries';
  id: string;
  attributes: Library;
}

export interface LibrariesResponse {
  results: LibraryItem[];
  paginationInfo: {
    skip: number;
    limit: number;
    total: number;
  };
}

export interface LibraryResponse {
  results: LibraryItem;
}
