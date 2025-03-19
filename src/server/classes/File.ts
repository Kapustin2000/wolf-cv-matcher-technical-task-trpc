import fs from 'fs';
import path from 'path';
import { Media } from '../types/File.js';

export default class File {

    protected static filesDir = path.resolve(process.cwd(), "files")
    
    static async upload(file, fileName: string, uploadPath: string): Promise<Media> {

        const fullPath = path.join(this.filesDir, uploadPath);
          
        fs.mkdirSync(fullPath, { recursive: true });

        const filePath = path.join(fullPath, fileName);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
    
        fs.writeFileSync(filePath, fileBuffer);
    
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