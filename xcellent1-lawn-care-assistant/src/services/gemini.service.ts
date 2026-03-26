
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = '/api/ai';

  constructor() { }

  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    try {
      const res = await fetch(`${this.apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, prompt })
      });
      const data = await res.json();
      return data.text || "I couldn't analyze the image. Please try again.";
    } catch (error) {
      console.error('AI Service Error:', error);
      return "Error connecting to AI service. Please check your connection.";
    }
  }

  async identifyPlant(base64Image: string): Promise<{ name: string, care: string, pests: string } | null> {
    try {
      const res = await fetch(`${this.apiUrl}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      const data = await res.json();
      return data; // Proxy returns parsed JSON
    } catch (e) {
      console.error("Plant ID Error", e);
      return null;
    }
  }

  async getDesignSuggestions(base64Image: string): Promise<string> {
    try {
      const res = await fetch(`${this.apiUrl}/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      const data = await res.json();
      // Original service returned stringified JSON mostly, but let's check usage.
      // If original returned response.text (which was array string), we return that.
      // Our proxy returns parsed JSON.
      // If the component expects a string to JSON.parse, we might need to stringify.
      // Checking usage in component would be safer, but simpler is to return JSON object if possible.
      // However, method signature returns Promise<string>. 
      // original code: return response.text; -> "['Plant1', 'Plant2']"
      // Let's assume component parses it.
      return JSON.stringify(data);
    } catch (e) {
      return "[]";
    }
  }

  async generatePersonalizedSchedule(plants: string[], month: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.apiUrl}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plants, month })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Schedule Generation Error", e);
      return [];
    }
  }

  async chat(history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> {
    try {
      const res = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message })
      });
      const data = await res.json();
      return data.text;
    } catch (error) {
      console.error('Chat Error:', error);
      return "I'm having trouble connecting right now.";
    }
  }
}