'use server';

/**
 * @fileOverview Generates music recommendations based on user mood, language, and genres.
 *
 * - generateMusicRecommendations - A function that handles the music recommendation process.
 * - GenerateMusicRecommendationsInput - The input type for the generateMusicRecommendations function.
 * - GenerateMusicRecommendationsOutput - The return type for the generateMusicRecommendations function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// --- Input Schema ---
const GenerateMusicRecommendationsInputSchema = z.object({
  mood: z.string().describe('The user-described mood.'),
  language: z.string().describe('The preferred language of the user.'),
  genres: z.array(z.string()).describe('The genre preferences of the user.'),
});
export type GenerateMusicRecommendationsInput = z.infer<typeof GenerateMusicRecommendationsInputSchema>;


// --- Output Schema ---
const SongSchema = z.object({
    name: z.string().describe('The name of the recommended song.'),
    artist: z.string().describe('The artist(s) of the recommended song.'),
    // Removed youtubeMusicUrl - it will be generated on the client as a search link
});

const PlaylistSchema = z.object({
    name: z.string().describe('The name of the recommended playlist theme (e.g., "Chill Vibes", "Energetic Morning").'),
    description: z.string().describe('A brief description of the playlist theme and why it fits the mood.'),
    // No direct URL, as LLM can't create playlists. We'll generate a search link in the component.
});


const GenerateMusicRecommendationsOutputSchema = z.object({
  songs: z.array(SongSchema).length(5).describe('An array of exactly 5 song recommendations with name and artist.'),
  playlists: z.array(PlaylistSchema).length(2).describe('An array of exactly 2 playlist theme recommendations.'),
  analysis: z.string().describe('A brief analysis of the interpreted mood and how the recommendations fit.')
});
export type GenerateMusicRecommendationsOutput = z.infer<typeof GenerateMusicRecommendationsOutputSchema>;


// --- Exported Wrapper Function ---
export async function generateMusicRecommendations(input: GenerateMusicRecommendationsInput): Promise<GenerateMusicRecommendationsOutput> {
  return generateMusicRecommendationsFlow(input);
}


// --- Genkit Prompt Definition ---
const prompt = ai.definePrompt({
  name: 'generateMusicRecommendationsPrompt',
  input: {
    schema: GenerateMusicRecommendationsInputSchema,
  },
  output: {
    schema: GenerateMusicRecommendationsOutputSchema,
  },
  prompt: `You are Moodify, a helpful music recommendation assistant.
A user has described their mood as "{{mood}}", prefers music in "{{language}}", and likes the following genres: {{#each genres}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

Based on this input:
1.  Analyze the user's mood, considering valence and energy.
2.  Recommend exactly 5 real songs by real artists that fit the mood, language, and genres. For each song, provide **only** its name and artist. Do NOT provide any URLs.
3.  Suggest exactly 2 playlist themes (e.g., "Focus Flow", "Late Night Chill") that match the user's preferences. For each playlist theme, provide a name and a short description explaining the vibe.
4.  Provide a brief overall analysis of the mood and why the recommendations fit.

Ensure the output strictly follows the required JSON format. Do not include any extra text or explanations outside the JSON structure.
`,
});


// --- Genkit Flow Definition ---
const generateMusicRecommendationsFlow = ai.defineFlow<
  typeof GenerateMusicRecommendationsInputSchema,
  typeof GenerateMusicRecommendationsOutputSchema
>(
  {
    name: 'generateMusicRecommendationsFlow',
    inputSchema: GenerateMusicRecommendationsInputSchema,
    outputSchema: GenerateMusicRecommendationsOutputSchema,
  },
  async (input) => {
    console.log("Calling Genkit flow with input:", input);
    try {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error("Genkit prompt returned no output.");
        }
        // Basic validation to ensure arrays have the correct length
        if (output.songs?.length !== 5 || output.playlists?.length !== 2) {
            console.warn("LLM did not return the expected number of items.", output);
            // Potentially add fallback logic or re-prompting here if needed
             // For now, let it pass but log warning. More robust handling could involve erroring or attempting correction.
        }
        console.log("Genkit flow received output:", output);
        return output;
    } catch (error) {
        console.error("Error executing Genkit flow:", error);
        // Rethrowing the error preserves the original error information, including the API error details
        throw error;
    }
  }
);
