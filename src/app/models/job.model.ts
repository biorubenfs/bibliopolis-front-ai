export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface JobReport {
  total: number;
  imported: string[];
  skipped: string[];
  failed: string[];
}

export interface Job {
  id: string;
  userId: string;
  jobType: string;
  status: JobStatus;
  resourceId?: string;
  report?: JobReport;
  createdAt: string;
  updatedAt: string;
}

export interface JobItem {
  type: 'jobs';
  id: string;
  attributes: Omit<Job, 'id'>;
}

export interface JobResponse {
  results: JobItem;
}

export interface JobsResponse {
  results: JobItem[];
  paginationInfo: {
    skip: number;
    limit: number;
    total: number;
  };
}

export interface ImportLibraryJobResponse {
  results: {
    type: 'library-import-job';
    attributes: {
      jobId: string;
      libraryId: string;
    };
  };
}
