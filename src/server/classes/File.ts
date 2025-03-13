import fs from 'fs';
import path from 'path';

export default class File {

    protected static filesDir = path.resolve(process.cwd(), "src/server/uploads")
    
    static async upload(file, fileName: string, uploadPath: string): Promise<Boolean> {

        const fullPath = path.join(this.filesDir, uploadPath); // Use `this` to reference the static variable
          
        fs.mkdirSync(fullPath, { recursive: true });

        const stream = fs.createWriteStream(path.join(fullPath, fileName));
        stream.write(Buffer.from(await file.arrayBuffer()));
        stream.end();

        return true;
    }
}