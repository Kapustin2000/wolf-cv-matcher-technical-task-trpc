export class BaseError extends Error {
    constructor(
        public message: string,
        public code: string,
        public status: number,
        public data?: any
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class FileProcessingError extends BaseError {
    constructor(message: string, data?: any) {
        super(message, 'FILE_PROCESSING_ERROR', 400, data);
    }
}

export class FileServiceError extends BaseError {
    constructor(message: string, data?: any) {
        super(message, 'FILE_SERVICE_ERROR', 500, data);
    }
}

export class PDFProcessingError extends BaseError {
    constructor(message: string, data?: any) {
        super(message, 'PDF_PROCESSING_ERROR', 500, data);
    }
}

export class AIServiceError extends BaseError {
    constructor(message: string, data?: any) {
        super(message, 'AI_SERVICE_ERROR', 500, data);
    }
}

export class ValidationError extends BaseError {
    constructor(message: string, data?: any) {
        super(message, 'VALIDATION_ERROR', 400, data);
    }
}

export class FileUploadError extends FileServiceError {
    constructor(message: string, data?: any) {
        super(`File upload failed: ${message}`, data);
    }
}

export class DirectoryError extends FileServiceError {
    constructor(message: string, data?: any) {
        super(`Directory operation failed: ${message}`, data);
    }
}

export class RateLimitError extends BaseError {
    constructor(message: string, data?: any) {
        super(message, 'RATE_LIMIT_ERROR', 429, data);
    }
} 