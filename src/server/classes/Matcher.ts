import natural from "natural";
import stopword from "stopword";
import nlp from "compromise";

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
                Authorization: `Bearer ${AUTH_TOKEN}`,
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

        console.log(response);

        const data = await response.json();

        console.log(data);

        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No AI response.";
    }

    static async match(cvText: string, vacancyText: string): Promise<object> {
              
        const cleanedCV = this.preprocessText(cvText);
        const cleanedJD = this.preprocessText(vacancyText);

        const cvSkills = this.extractSkills(cleanedCV);
        const jdSkills = this.extractSkills(cleanedJD);

        const { matchedSkills, missingSkills } = this.compareSkills(cvSkills, jdSkills);

        const review = await this.analyzeWithAI(cleanedCV, cleanedJD);

        return { matchedSkills, missingSkills, review };
    }
}
