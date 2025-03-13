import fs from 'fs';
import path from 'path';

export default class File {

    protected static filesDir = path.resolve(process.cwd(), "files")
    
    static async upload(file, fileName: string, uploadPath: string): Promise<Boolean> {

        const fullPath = path.join(this.filesDir, uploadPath);
          
        fs.mkdirSync(fullPath, { recursive: true });

        const stream = fs.createWriteStream(path.join(fullPath, fileName));
        stream.write(Buffer.from(await file.arrayBuffer()));
        stream.end();

        return true;
    }

    static save(fileName: string, content: string, format: string, savePath: string): string {
        const fullPath = path.join(this.filesDir, savePath);

        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }

        const filePath = path.join(fullPath, `${fileName}.${format}`);

        fs.writeFileSync(filePath, content, "utf8");

        return filePath;
    }
}