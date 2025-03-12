import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

export default class File {

    protected static filesDir = path.dirname(fileURLToPath(import.meta.url));
    
    static async upload(file, fileName: string, uploadPath: string): Promise<Boolean> {

        const fullPath = path.join(this.filesDir, uploadPath); // Use `this` to reference the static variable
          
        fs.mkdirSync(fullPath, { recursive: true });

        const stream = fs.createWriteStream(path.join(fullPath, fileName));
        stream.write(Buffer.from(await file.arrayBuffer()));
        stream.end();

        return true;
    }
}