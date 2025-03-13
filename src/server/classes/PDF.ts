import fs from 'fs';
import path from 'path';
import { getDocument } from 'pdfjs-dist';

export default class PDF {

    protected static filesDir = path.resolve(process.cwd(), "src/server/uploads")

    // Method to extract text from PDF file
    static async extractText(filePath: string): Promise<string> {
        const dataBuffer = fs.readFileSync(filePath);
          
          const uint8Array = new Uint8Array(dataBuffer);
        
          const pdfDoc = await getDocument(uint8Array).promise;
        
          // Extract text from all pages
          let extractedText = '';
          const numPages = pdfDoc.numPages;
        
          // Loop through each page of the PDF
          for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
              const page = await pdfDoc.getPage(pageNumber);
              const textContent = await page.getTextContent();
              
              // Extract the text content from each page's content
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              extractedText += pageText + '\n';  // Add page text with newline separation
          }

          return extractedText;
    }
}
