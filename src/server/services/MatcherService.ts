import natural from "natural";
import stopword from "stopword";
import nlp from "compromise";
import { config } from '../config/index.js';
import { AIServiceError, ValidationError, BaseError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { RateLimiter, RateLimiterError } from './RateLimiter';

export default class MatcherService {

    protected static tokenizer = new natural.WordTokenizer();
    private static readonly MAX_TEXT_LENGTH = 50000; // Arbitrary limit
    private static readonly MIN_TEXT_LENGTH = 50;
    private static rateLimiter = new RateLimiter();

    protected static preprocessText(text: string) {    
        const words = this.tokenizer.tokenize(text);
        
        return stopword.removeStopwords(words).join(" ");
    }

    protected static extractSkills(text: string): Set<string> {
        const doc = nlp(text);
        const nouns = doc.nouns().out("array"); // Extract nouns (skills are usually nouns)
        const capitalizedWords = text.match(/\b[A-Z][a-zA-Z0-9.-]+\b/g) || []; // Extract capitalized words

        return new Set([...nouns, ...capitalizedWords].map(word => word.toLowerCase()));
    }

    protected static compareSkills(cvSkills: Set<string>, jdSkills: Set<string>): { matchedSkills: string[], missingSkills: string[] } {
        const matchedSkills = [...cvSkills].filter(skill => jdSkills.has(skill));
        const missingSkills = [...jdSkills].filter(skill => !cvSkills.has(skill));
        return { matchedSkills, missingSkills };
    }

    static async match(cvText: string, jobDescriptionText: string): Promise<string> {
        try {
            logger.info('Starting match analysis');

            // Validate inputs
            this.validateInput(cvText, 'CV');
            this.validateInput(jobDescriptionText, 'Job Description');

            const cleanedCV = await this.cleanText(cvText);
            const cleanedJD = await this.cleanText(jobDescriptionText);

            const result = await this.analyzeWithAI(cleanedCV, cleanedJD);

            logger.info('Match analysis completed successfully');
            return result;

        } catch (error) {
            logger.error('Match analysis failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            if (error instanceof BaseError) {
                throw error;
            }

            throw new AIServiceError('Match analysis failed', {
                originalError: error
            });
        }
    }

    private static validateInput(text: string, source: string): void {
        if (!text || typeof text !== 'string') {
            throw new ValidationError(`Invalid ${source} text provided`);
        }

        if (text.length < this.MIN_TEXT_LENGTH) {
            throw new ValidationError(`${source} text is too short`, {
                length: text.length,
                minLength: this.MIN_TEXT_LENGTH
            });
        }

        if (text.length > this.MAX_TEXT_LENGTH) {
            throw new ValidationError(`${source} text exceeds maximum length`, {
                length: text.length,
                maxLength: this.MAX_TEXT_LENGTH
            });
        }
    }

    protected static async cleanText(text: string): Promise<string> {
        try {
            // Basic text cleaning
            return text
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

        } catch (error) {
            throw new ValidationError('Text cleaning failed', {
                originalError: error
            });
        }
    }

    protected static async analyzeWithAI(
        cleanedCV: string,
        cleanedJD: string
    ): Promise<string> {
        try {
            // Check rate limit before making the API call
            await this.rateLimiter.checkLimit();

            if (!process.env.AI_API_TOKEN) {
                throw new AIServiceError('AI API token not configured');
            }

            const aiPrompt = `
Preprocessed Job Description:
${cleanedJD}

Preprocessed Candidate CV:
${cleanedCV}

### Task:
- Provide a **short summary (under 100 words)** on how well the candidate fits this role.
            `;

            const response = await fetch(process.env.AI_API_ENDPOINT!, {
                method: "POST",
                headers: {
                    Authorization: process.env.AI_API_TOKEN,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: aiPrompt }]
                        }
                    ]
                })
            });

            if (!response.ok) {
                // Check if it's a rate limit error from the API
                if (response.status === 429) {
                    throw new RateLimiterError('AI service rate limit exceeded');
                }
                throw new AIServiceError('AI service request failed', {
                    status: response.status,
                    statusText: response.statusText
                });
            }

            const data = await response.json();

            if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new AIServiceError('Invalid AI response format');
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            if (error instanceof RateLimiterError) {
                logger.warn('Rate limit exceeded', {
                    error: error.message,
                    status: this.rateLimiter.getCurrentStatus()
                });
                throw error;
            }

            if (error instanceof AIServiceError) {
                throw error;
            }

            throw new AIServiceError('AI analysis failed', {
                originalError: error
            });
        }
    }
}
