import fs from 'fs/promises';
import path from 'path';
import { Media } from '../types/Media.js';
import { FileUploadError, DirectoryError, FileServiceError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export default class FileService {
    private static readonly filesDir: string = path.resolve(process.cwd(), "files");
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Uploads a file asynchronously.
     * @param file - The file object.
     * @param fileName - The target file name.
     * @param uploadPath - Relative directory where the file should be stored.
     * @returns Metadata of the uploaded file.
     */
    static async upload(file: any, fileName: string, uploadPath: string): Promise<Media> {
        try {
            // Validate file
            if (!file) {
                throw new FileUploadError('No file provided');
            }

            if (file.size > this.MAX_FILE_SIZE) {
                throw new FileUploadError('File size exceeds limit', {
                    maxSize: this.MAX_FILE_SIZE,
                    actualSize: file.size
                });
            }

            logger.info('Starting file upload', {
                fileName,
                uploadPath,
                fileSize: file.size,
                fileType: file.type
            });

            const fullPath = await this.ensureDirectory(uploadPath);
            const filePath = path.join(fullPath, fileName);

            // Check if file already exists
            try {
                await fs.access(filePath);
                throw new FileUploadError('File already exists', { filePath });
            } catch (error) {
                // File doesn't exist, we can proceed
                if ((error as any).code !== 'ENOENT') {
                    throw error;
                }
            }

            await this.saveBuffer(filePath, file);
            const metadata = this.createFileMetadata(filePath, fileName, uploadPath, file);

            logger.info('File upload successful', {
                fileName,
                filePath,
                fileSize: file.size
            });

            return metadata;

        } catch (error) {
            logger.error('File upload failed', {
                fileName,
                uploadPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            if (error instanceof FileServiceError) {
                throw error;
            }

            throw new FileUploadError('Upload failed', {
                originalError: error
            });
        }
    }

    /**
     * Ensures a directory exists, creates it if missing.
     * @param relativePath - The directory path relative to `filesDir`.
     * @returns The full absolute directory path.
     */
    private static async ensureDirectory(relativePath: string): Promise<string> {
        try {
            if (!relativePath) {
                throw new DirectoryError('Invalid directory path');
            }

            // Prevent directory traversal attacks
            const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
            const fullPath = path.join(this.filesDir, normalizedPath);

            await fs.mkdir(fullPath, { recursive: true });
            
            logger.debug('Directory ensured', { fullPath });
            return fullPath;

        } catch (error) {
            logger.error('Failed to ensure directory', {
                relativePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw new DirectoryError('Failed to create directory', {
                path: relativePath,
                originalError: error
            });
        }
    }

    /**
     * Saves a file buffer asynchronously.
     * @param filePath - Full path where the file will be saved.
     * @param file - The file object.
     */
    private static async saveBuffer(filePath: string, file: any): Promise<void> {
        try {
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filePath, fileBuffer);
            
            logger.debug('File buffer saved', { filePath });

        } catch (error) {
            logger.error('Failed to save file buffer', {
                filePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw new FileUploadError('Failed to save file', {
                path: filePath,
                originalError: error
            });
        }
    }

    /**
     * Generates file metadata.
     * @param filePath - Full file path.
     * @param fileName - The file name.
     * @param uploadPath - The relative directory.
     * @param file - The original file object.
     * @returns File metadata.
     */
    private static createFileMetadata(filePath: string, fileName: string, uploadPath: string, file: any): Media {
        try {
            const metadata = {
                path: filePath,
                fileName,
                uploadPath,
                fileType: file.type,
                fileSize: file.size,
                fileExtension: path.extname(fileName),
            };

            logger.debug('File metadata created', metadata);
            return metadata;

        } catch (error) {
            logger.error('Failed to create file metadata', {
                fileName,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw new FileUploadError('Failed to create file metadata', {
                fileName,
                originalError: error
            });
        }
    }

    /**
     * Cleans up a file.
     * @param filePath - Path to the file to be deleted.
     */
    static async cleanup(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            logger.info('File cleaned up successfully', { filePath });
        } catch (error) {
            logger.error('Failed to cleanup file', {
                filePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            // We don't throw here as cleanup failures shouldn't break the application
        }
    }
}