import { API_URL } from "./api";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  message: {
    content: string;
  };
}

/**
 * Service NovaTech IA - Intégration Ollama Cloud
 */
export async function chatWithNova(
  model: string,
  messages: Message[],
  stream: boolean = false
) {
  try {
    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.statusText}`);
    }

    if (stream) {
      return response.body; 
    }

    const data = await response.json();
    return data as AIResponse;
  } catch (error) {
    console.error("NovaTech IA Error:", error);
    throw error;
  }
}

/**
 * Générateur de système prompt basé sur l'identité du restaurant
 */
export function getSystemPrompt(restaurantName: string, context: string): string {
  return `Tu es Nova, l'IA experte de NovaTech OS intégrée au restaurant "${restaurantName}".
Ta mission est d'assister le personnel et les clients avec élégance, précision et un sens aigu de la gastronomie.
Contexte actuel : ${context}
Réponds toujours de manière concise et professionnelle.`;
}
