import fs from 'fs/promises';
import path from 'path';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import { PDFProcessingError } from '../utils/errors';
import { logger } from '../utils/logger';

export default class PDFService {
    private static readonly filesDir = path.resolve(process.cwd(), "files");
    private static readonly MAX_PAGE_LIMIT = 50; // Arbitrary limit

    /**
     * Extracts text from a PDF file.
     * @param filePath - The absolute path to the PDF file.
     * @returns The extracted text content.
     */
    static async extractText(filePath: string): Promise<string> {
        try {
            logger.info('Starting PDF text extraction', { filePath });

            // Validate file existence
            try {
                await fs.access(filePath);
            } catch (error) {
                throw new PDFProcessingError('PDF file not found', { filePath });
            }

            const dataBuffer = await fs.readFile(filePath);
            const pdfDoc = await getDocument({ data: new Uint8Array(dataBuffer) }).promise;

            // Check page count
            if (pdfDoc.numPages > this.MAX_PAGE_LIMIT) {
                throw new PDFProcessingError('PDF exceeds maximum page limit', {
                    pages: pdfDoc.numPages,
                    limit: this.MAX_PAGE_LIMIT
                });
            }

            const text = await this.extractTextFromPages(pdfDoc);
            
            logger.info('Successfully extracted text from PDF', {
                filePath,
                pageCount: pdfDoc.numPages,
                textLength: text.length
            });

            return text;

        } catch (error) {
            logger.error('Failed to extract text from PDF', {
                filePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError('Failed to process PDF', {
                originalError: error
            });
        }
    }

    /**
     * Extracts text from all pages of a PDF document.
     * @param pdfDoc - The parsed PDF document.
     * @returns The extracted text content from all pages.
     */
    private static async extractTextFromPages(pdfDoc: PDFDocumentProxy): Promise<string> {
        try {
            let extractedText = '';

            for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
                logger.debug('Processing PDF page', { pageNumber });
                const pageText = await this.extractTextFromPage(pdfDoc, pageNumber);
                extractedText += `${pageText}\n`;
            }

            return extractedText.trim();

        } catch (error) {
            throw new PDFProcessingError('Failed to extract text from pages', {
                pageCount: pdfDoc.numPages,
                originalError: error
            });
        }
    }

    /**
     * Extracts text from a single page of a PDF document.
     * @param pdfDoc - The parsed PDF document.
     * @param pageNumber - The page number to extract text from.
     * @returns The extracted text content from the page.
     */
    private static async extractTextFromPage(pdfDoc: PDFDocumentProxy, pageNumber: number): Promise<string> {
        try {
            const page = await pdfDoc.getPage(pageNumber);
            const textContent = await page.getTextContent();

            return textContent.items
                .map((item) => ("str" in item ? item.str : ''))
                .join(' ');

        } catch (error) {
            throw new PDFProcessingError('Failed to extract text from page', {
                pageNumber,
                originalError: error
            });
        }
    }
}