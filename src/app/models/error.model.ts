export interface ApiError {
  statusCode: number;
  errorCode: string;
  message: string;
  validationError?: Array<{
    code: string;
    expected?: string;
    received?: string;
    path: string[];
    message: string;
  }>;
}
