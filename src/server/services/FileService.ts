import fs from 'fs/promises';
import path from 'path';
import { Media } from '../types/Media.js';

export default class FileService {
    private static readonly filesDir: string = path.resolve(process.cwd(), "files");

    /**
     * Uploads a file asynchronously.
     * @param file - The file object.
     * @param fileName - The target file name.
     * @param uploadPath - Relative directory where the file should be stored.
     * @returns Metadata of the uploaded file.
     */
    static async upload(file: any, fileName: string, uploadPath: string): Promise<Media> {
        const fullPath = await this.ensureDirectory(uploadPath);
        const filePath = path.join(fullPath, fileName);

        await this.saveBuffer(filePath, file);
        return this.createFileMetadata(filePath, fileName, uploadPath, file);
    }

    /**
     * Ensures a directory exists, creates it if missing.
     * @param relativePath - The directory path relative to `filesDir`.
     * @returns The full absolute directory path.
     */
    private static async ensureDirectory(relativePath: string): Promise<string> {
        const fullPath = path.join(this.filesDir, relativePath);
        await fs.mkdir(fullPath, { recursive: true });
        return fullPath;
    }

    /**
     * Saves a file buffer asynchronously.
     * @param filePath - Full path where the file will be saved.
     * @param file - The file object.
     */
    private static async saveBuffer(filePath: string, file: any): Promise<void> {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, fileBuffer);
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
        return {
            path: filePath,
            fileName,
            uploadPath,
            fileType: file.type,
            fileSize: file.size,
            fileExtension: path.extname(fileName),
        };
    }
}