import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Initialize Gemini
// Note: In a real app, handle missing key gracefully.
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

router.post('/suggest-price', async (req, res) => {
  const { location, description } = req.body;
  
  if (!ai) {
    return res.json({ suggestion: 10, reasoning: "AI not configured, using default." });
  }

  try {
    const promptText = `
      I am creating a parking lot at: ${location}.
      Description: ${description}.
      Suggest a reasonable price per hour in USD (just the number) and a short reasoning.
      Return JSON format: { "price": number, "reasoning": "string" }
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: promptText,
    });
    const text = result.text;
    // Simple cleanup to ensure we get JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    res.json(data);
  } catch (error) {
    console.error("AI Error:", error);
    res.json({ price: 15, reasoning: "AI service unavailable, using market average." });
  }
});

router.post('/analyze-location', async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!ai) {
        return res.json({ analysis: "Location analysis unavailable without AI key." });
    }

    try {
        const promptText = `
            Analyze the parking viability for a location at coordinates: ${latitude}, ${longitude}.
            Assume this is a city environment. 
            Give a short 2 sentence summary of why this might be a good or bad spot for a parking lot (e.g. near malls, offices, etc).
            Invent plausible details based on typical urban layouts if specific map data isn't known.
        `;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            contents: promptText,
        });
        res.json({ analysis: result.text });
    } catch (error) {
        res.json({ analysis: "Could not analyze location." });
    }
});

export default router;
