import fs from 'fs/promises';
import path from 'path';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';

export default class PDFService {
    private static readonly filesDir = path.resolve(process.cwd(), "files");

    /**
     * Extracts text from a PDF file.
     * @param filePath - The absolute path to the PDF file.
     * @returns The extracted text content.
     */
    static async extractText(filePath: string): Promise<string> {
        const dataBuffer = await fs.readFile(filePath);
        const pdfDoc = await getDocument({ data: new Uint8Array(dataBuffer) }).promise;

        return await this.extractTextFromPages(pdfDoc);
    }

    /**
     * Extracts text from all pages of a PDF document.
     * @param pdfDoc - The parsed PDF document.
     * @returns The extracted text content from all pages.
     */
    private static async extractTextFromPages(pdfDoc: PDFDocumentProxy): Promise<string> {
        let extractedText = '';

        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
            const pageText = await this.extractTextFromPage(pdfDoc, pageNumber);
            extractedText += `${pageText}\n`;
        }

        return extractedText.trim();
    }

    /**
     * Extracts text from a single page of a PDF document.
     * @param pdfDoc - The parsed PDF document.
     * @param pageNumber - The page number to extract text from.
     * @returns The extracted text content from the page.
     */
    private static async extractTextFromPage(pdfDoc: PDFDocumentProxy, pageNumber: number): Promise<string> {
        const page = await pdfDoc.getPage(pageNumber);
        const textContent = await page.getTextContent();

        return textContent.items
            .map((item) => ("str" in item ? item.str : '')) // Ensure item has a `str` property
            .join(' ');
    }
}