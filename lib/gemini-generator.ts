import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "./logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface GeneratedContent {
  readme: string;
  landingPageCopy: string;
  vercelConfigExplanation: string;
  envTemplate: string;
}

export async function generateContentWithGemini(
  repoName: string,
  repoOwner: string,
  framework: string,
  packageJsonDeps: string[],
  analysisDescription: string
): Promise<GeneratedContent | null> {
  try {
    const prompt = `You are a technical writer. Generate deployment content for this repo.

Repo: ${repoOwner}/${repoName}
Framework: ${framework}
Key dependencies: ${packageJsonDeps.join(", ")}
Analysis: ${analysisDescription}

Return ONLY valid JSON (no markdown, no backticks):
{
  "readme": "README.md content (2-3 paragraphs on setup, usage, deployment)",
  "landingPageCopy": "Homepage headline, tagline, and 3 feature bullet points",
  "vercelConfigExplanation": "Comments explaining the Vercel deployment (build command, output directory, etc.)",
  "envTemplate": "Environment variables needed with descriptions (KEY=description format, one per line)"
}`;

    const result = (await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), 5000)),
    ])) as { response: { text: () => string } };

    const content = result.response.text();
    const parsed = JSON.parse(content);

    return {
      readme: parsed.readme || "",
      landingPageCopy: parsed.landingPageCopy || "",
      vercelConfigExplanation: parsed.vercelConfigExplanation || "",
      envTemplate: parsed.envTemplate || "",
    };
  } catch (error) {
    log.warn({ error }, "Gemini generation failed, using template defaults");
    return null;
  }
}
