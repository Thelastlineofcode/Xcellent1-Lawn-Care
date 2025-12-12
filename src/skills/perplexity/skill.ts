/**
 * ARCHIVED: Perplexity Research Skill - TypeScript/Deno Version
 * This module is part of experimental AI features which are paused by project policy.
 * Do not use in active server code unless explicitly re-enabled.
 * See docs/AI_SUSPENDED.md and bmad/agents/langchain-integration/ARCHIVED.md for details.
 *
 * Perplexity Research Skill - Token-efficient web research for AI agents
 */

export interface ResearchOptions {
  model?: "sonar" | "sonar-pro" | "sonar-reasoning-pro";
  maxTokens?: number;
  recency?: "day" | "week" | "month" | "year";
  temperature?: number;
}

export interface ResearchResult {
  answer: string;
  citations: string[];
  model: string;
  tokensUsed: number;
  executionTime: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export class PerplexityResearch {
  private apiKey: string;
  private endpoint = "https://api.perplexity.ai/chat/completions";

  constructor(apiKey?: string) {
    // Guard: Modules are archived by default. Only allow instantiation when
    // the environment variable ENABLE_AI_PROTOTYPES=true. This avoids accidental
    // use of prototypes in production or CI.
    const enabled =
      (Deno.env.get("ENABLE_AI_PROTOTYPES") || "false").toLowerCase() ===
        "true";
    if (!enabled) {
      throw new Error(
        "PerplexityResearch prototypes are archived. Set ENABLE_AI_PROTOTYPES=true to enable.",
      );
    }

    this.apiKey = apiKey || Deno.env.get("PERPLEXITY_API_KEY") || "";
    if (!this.apiKey) {
      throw new Error("PERPLEXITY_API_KEY not found in environment");
    }
  }

  async query(
    question: string,
    options: ResearchOptions = {},
  ): Promise<ResearchResult> {
    const startTime = Date.now();

    const {
      model = "sonar-pro",
      maxTokens = 2000,
      recency = "month",
      temperature = 0.2,
    } = options;

    const payload = {
      model,
      messages: [
        {
          role: "system",
          content:
            "Provide accurate, well-researched answers with citations. Focus on current best practices.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_tokens: maxTokens,
      temperature,
      return_citations: true,
      search_recency_filter: recency,
      stream: false,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;

      return {
        answer: data.choices[0].message.content,
        citations: data.citations || [],
        model,
        tokensUsed: data.usage?.total_tokens || 0,
        executionTime: Math.round(executionTime * 100) / 100,
        timestamp: new Date().toISOString(),
        success: true,
      };
    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000;

      return {
        answer: "",
        citations: [],
        model,
        tokensUsed: 0,
        executionTime: Math.round(executionTime * 100) / 100,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Simple function interface
export async function research(
  query: string,
  options?: ResearchOptions,
): Promise<ResearchResult> {
  const skill = new PerplexityResearch();
  return await skill.query(query, options);
}

// Example usage
if (import.meta.main) {
  const result = await research("Best practices for lawn mowing patterns");

  if (result.success) {
    console.log(`Answer: ${result.answer}`);
    console.log(`\nSources: ${result.citations.length} citations`);
    console.log(`Tokens: ${result.tokensUsed}`);
    console.log(`Time: ${result.executionTime}s`);
  } else {
    console.error(`Error: ${result.error}`);
  }
}
