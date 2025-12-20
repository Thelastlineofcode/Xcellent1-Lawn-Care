
import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI with ADC
// Cloud Run injects GOOGLE_CLOUD_PROJECT, or standard ADC discovery finds it.
const project = Deno.env.get("GOOGLE_CLOUD_PROJECT") || "gen-lang-client-0072608241"; // Fallback to observed ID
const location = "us-central1";

const vertexAI = new VertexAI({ project, location });
const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

export async function handleAiRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace("/api/ai/", ""); // "analyze", "chat", etc.

    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const body = await req.json();

        switch (path) {
            case "analyze":
                return await handleAnalyze(body);
            case "identify":
                return await handleIdentify(body);
            case "design":
                return await handleDesign(body);
            case "schedule":
                return await handleSchedule(body);
            case "chat":
                return await handleChat(body);
            default:
                return new Response("Not found", { status: 404 });
        }
    } catch (err) {
        console.error(`[AI Proxy] Error in ${path}:`, err);
        return new Response(JSON.stringify({ error: "AI processing failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

async function handleAnalyze(body: { image: string, prompt?: string }) {
    const { image, prompt } = body;
    console.log("[AI] Analyzing lawn image...");

    const req = {
        contents: [{
            role: "user",
            parts: [
                { inlineData: { mimeType: "image/jpeg", data: image } },
                { text: prompt || "Analyze this lawn image. Identify any pests, diseases, or deficiencies. Be concise." }
            ]
        }]
    };

    const result = await model.generateContent(req);
    const text = result.response.candidates?.[0].content.parts[0].text || "";
    return jsonResponse({ text });
}

async function handleIdentify(body: { image: string }) {
    console.log("[AI] Identifying plant...");
    const prompt = "Identify this plant. Return JSON with 3 fields: 'name' (common name), 'care' (1 sentence on water/sun), 'pests' (common pests/diseases). Do not use markdown.";

    const req = {
        contents: [{
            role: "user",
            parts: [
                { inlineData: { mimeType: "image/jpeg", data: body.image } },
                { text: prompt }
            ]
        }]
    };

    const result = await model.generateContent(req);
    const text = result.response.candidates?.[0].content.parts[0].text || "{}";

    // Clean markdown format if present
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return jsonResponse(JSON.parse(cleanJson));
}

async function handleDesign(body: { image: string }) {
    console.log("[AI] Generating design suggestions...");
    const prompt = "Analyze this yard. Suggest 3 specific South Louisiana native plants (flowers, shrubs, or trees) that would look good here given the visible light and space. Return ONLY a JSON array of strings, e.g., ['Azaleas', 'Live Oak', 'Lantana']. Do not use markdown formatting.";

    const req = {
        contents: [{
            role: "user",
            parts: [
                { inlineData: { mimeType: "image/jpeg", data: body.image } },
                { text: prompt }
            ]
        }]
    };

    const result = await model.generateContent(req);
    const text = result.response.candidates?.[0].content.parts[0].text || "[]";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return jsonResponse(JSON.parse(cleanJson));
}

async function handleSchedule(body: { plants: string[], month: string }) {
    console.log("[AI] Generating schedule...");
    const prompt = `Create a checklist of 3-5 lawn care tasks for ${body.month} in South Louisiana (Zone 9a). 
  Consider these specific plants in the user's garden: ${body.plants.join(', ')}. 
  Return JSON array of objects with 'title' (string), 'type' (enum: mow, fertilize, pest, water), 'description' (string). Change type to ONE of the enums. Do not use markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0].content.parts[0].text || "[]";
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return jsonResponse(JSON.parse(cleanJson));
}

async function handleChat(body: { history: any[], message: string }) {
    console.log("[AI] Chat request...");
    // Convert history from Vertex format if needed, but SDK handles roughly same structure
    // Angular sends: {role: string, parts: {text: string}[]}
    // Vertex expects: {role: 'user'|'model', parts: [{text: string}]}

    const history = body.history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: h.parts
    }));

    const chat = model.startChat({
        history,
        systemInstruction: {
            role: "system",
            parts: [{ text: 'You are an expert lawn care assistant for South Louisiana (USDA Zone 8b/9a). You are knowledgeable about St. Augustine, Bermuda, Zoysia grasses, and local plants like Live Oaks and Azaleas. You help with pests like Chinch bugs and sod webworms. Be helpful, concise, and friendly.' }]
        }
    });

    const result = await chat.sendMessage(body.message);
    const text = result.response.candidates?.[0].content.parts[0].text || "";
    return jsonResponse({ text });
}

function jsonResponse(data: any) {
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
    });
}
