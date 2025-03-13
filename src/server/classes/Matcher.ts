import natural from "natural";
import stopword from "stopword";
import nlp from "compromise";
import path from 'path';
import PDF from '../classes/PDF.js';
import File from '../classes/File.js';
export default class Matcher {

    protected static tokenizer = new natural.WordTokenizer();

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

    protected static async analyzeWithAI(
        cleanedCV: string,
        cleanedJD: string
    ): Promise<string> {
        const aiPrompt = `
Preprocessed Job Description:
${cleanedJD}

Preprocessed Candidate CV:
${cleanedCV}

### Task:
- Provide a **short summary (under 100 words)** on how well the candidate fits this role.
        `;

        const response = await fetch("https://intertest.woolf.engineering/invoke", {
            method: "POST",
            headers: {
                
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

        const data = await response.json();

        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No AI response.";
    }

    static async match(matchRequestId: string): Promise<object> {

        console.log(matchRequestId);
        const cvText = await PDF.extractText(path.resolve(process.cwd(), "files", matchRequestId, "cv.pdf"));
        const vacancyText = await PDF.extractText(path.resolve(process.cwd(), "files", matchRequestId, "vacancy.pdf"));
        
        const cleanedCV = this.preprocessText(cvText);
        const cleanedJD = this.preprocessText(vacancyText);

        const cvSkills = this.extractSkills(cleanedCV);
        const jdSkills = this.extractSkills(cleanedJD);

        const { matchedSkills, missingSkills } = this.compareSkills(cvSkills, jdSkills);

        const review = await this.analyzeWithAI(cleanedCV, cleanedJD);

        File.save('match', JSON.stringify({ matchedSkills, missingSkills, review }), 'json', `${matchRequestId}`)

        return { matchedSkills, missingSkills, review };
    }
}
