import OpenAI from "openai";
import type { RepoAnalysis } from "@/types";
import { GitHubClient } from "@/lib/github";
import type { Logger } from "@/lib/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Tool Definitions ────────────────────────────────────────────────────────

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "read_repo_file",
      description:
        "Read the contents of a specific file in the GitHub repository. Use this to understand the actual code, configuration, or documentation.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "The file path relative to the repo root (e.g. 'src/index.ts', 'README.md')",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_repo_files",
      description:
        "List files and directories at a given path in the repository. Use this to explore the repo structure.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory path to list (use '' or '/' for root)",
          },
        },
        required: ["path"],
      },
    },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, string>,
  github: GitHubClient,
  owner: string,
  repo: string,
  logger?: Logger
): Promise<string> {
  try {
    if (name === "read_repo_file") {
      const path = args.path;
      logger?.debug("OpenAI tool: read_repo_file", { path });
      const content = await github.getFileContent(owner, repo, path);
      if (!content) {
        logger?.warn("OpenAI tool: file not found", { path });
        return `File not found: ${path}`;
      }
      const truncated =
        content.length > 3000
          ? content.slice(0, 3000) + "\n...[truncated]"
          : content;
      return truncated;
    }

    if (name === "list_repo_files") {
      const path = args.path || "";
      logger?.debug("OpenAI tool: list_repo_files", { path });
      const contents = await github.getRepoContents(owner, repo, path);
      if (!contents || !Array.isArray(contents)) {
        logger?.warn("OpenAI tool: directory not found or empty", { path });
        return "Directory not found or empty";
      }
      return contents
        .map((f: { type: string; path: string }) =>
          `${f.type === "dir" ? "📁" : "📄"} ${f.path}`
        )
        .join("\n");
    }

    logger?.warn("OpenAI tool: unknown tool requested", { name });
    return "Unknown tool";
  } catch (err) {
    logger?.error("OpenAI tool execution error", undefined, err);
    return `Tool error: ${String(err)}`;
  }
}

// ─── Main Agent ───────────────────────────────────────────────────────────────

export interface OpenAIAgentResult {
  readme: string;
  landingPageCopy: string;
  deploymentRecommendations: string[];
  enhancedDescription: string;
}

export async function runOpenAIAgent(
  owner: string,
  repo: string,
  analysis: RepoAnalysis,
  githubToken: string,
  onStep?: (label: string, detail?: string) => void,
  logger?: Logger
): Promise<OpenAIAgentResult> {
  const github = new GitHubClient(githubToken);
  const agentLogger = logger?.child({ agent: "openai", owner, repo });

  const systemPrompt = `You are Shipwright AI, an expert developer assistant that helps ship GitHub repositories to production.

You have access to tools to read files from the repository "${owner}/${repo}".
Use them to understand the actual codebase before generating content.

Repository analysis already done:
- Framework: ${analysis.framework}
- Package Manager: ${analysis.packageManager}
- Backend: ${analysis.backendType}
- Has Docker: ${analysis.hasDocker}
- Env vars detected: ${analysis.envVarsDetected.join(", ") || "none"}
- Missing configs: ${analysis.missingConfigs.join(", ") || "none"}
- Risk score: ${analysis.deploymentRiskScore}/100

Your job:
1. Explore the repo (read key files like README, main entry points, config files)
2. Generate a professional, accurate README.md
3. Generate compelling landing page copy (hero headline, subheadline, 3 feature bullets)
4. Provide 3 specific deployment recommendations

Be concise and cost-efficient with tool calls — max 5 tool calls total.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Analyze the repository "${owner}/${repo}" and generate:
1. A professional README.md (markdown format)
2. Landing page copy: { headline, subheadline, features: [3 items] }
3. Three deployment recommendations

Start by exploring the repo structure, then read 1-2 key files.`,
    },
  ];

  onStep?.("Connecting to OpenAI", "Using gpt-4o-mini");
  agentLogger?.info("Starting OpenAI agent run", {
    framework: analysis.framework,
    backendType: analysis.backendType,
  });

  let iterations = 0;
  const maxIterations = 8;

  while (iterations < maxIterations) {
    iterations++;

    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 2000,
        temperature: 0.7,
      });
    } catch (err) {
      agentLogger?.error("OpenAI chat completion failed", undefined, err);
      onStep?.(
        "OpenAI error",
        "Falling back to template-based README and copy"
      );
      return generateFallbackResult(analysis, repo);
    }

    const message = response.choices[0].message;
    messages.push(message);

    // No more tool calls — we have the final answer
    if (!message.tool_calls || message.tool_calls.length === 0) {
      onStep?.("OpenAI generation complete", "Parsing response");
      agentLogger?.info("OpenAI agent returned final message");
      return parseAgentResponse(message.content || "", analysis, repo);
    }

    // Execute tool calls (only function-type tool calls)
    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;

      const fnCall = toolCall as OpenAI.Chat.ChatCompletionMessageToolCall & {
        function: { name: string; arguments: string };
      };

      const args = JSON.parse(
        fnCall.function.arguments
      ) as Record<string, string>;
      onStep?.(
        `Reading ${args.path || "repo files"}`,
        `Tool: ${fnCall.function.name}`
      );
      agentLogger?.debug("Executing OpenAI tool call", {
        tool: fnCall.function.name,
        path: args.path,
      });

      const result = await executeTool(
        fnCall.function.name,
        args,
        github,
        owner,
        repo,
        agentLogger
      );

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  agentLogger?.warn(
    "OpenAI agent reached max iterations, using fallback result"
  );
  // Fallback if max iterations reached
  return generateFallbackResult(analysis, repo);
}

// ─── Response Parser ──────────────────────────────────────────────────────────

export function parseAgentResponse(
  content: string,
  analysis: RepoAnalysis,
  repoName: string
): OpenAIAgentResult {
  // Extract README section
  const readmeMatch =
    content.match(/```markdown\n([\s\S]*?)```/i) ||
    content.match(/# .+[\s\S]*/);
  const readme = readmeMatch
    ? readmeMatch[1] || readmeMatch[0]
    : generateFallbackReadme(analysis, repoName);

  // Extract landing page copy
  const headlineMatch = content.match(/headline[:\s"]+([^\n"]+)/i);
  const subheadlineMatch = content.match(/subheadline[:\s"]+([^\n"]+)/i);
  const featuresMatch = content.match(/features?[:\s\[]+([^\]]+)/i);

  const landingPageCopy = JSON.stringify({
    headline:
      headlineMatch?.[1]?.trim() ||
      `Ship ${repoName} to production`,
    subheadline:
      subheadlineMatch?.[1]?.trim() ||
      `${analysis.framework} app ready for deployment`,
    features: featuresMatch
      ? featuresMatch[1]
          .split(/[,\n]/)
          .slice(0, 3)
          .map((f) => f.trim())
      : ["Fast deployment", "Production ready", "Easy configuration"],
  });

  // Extract recommendations
  const recMatches = content.match(/\d\.\s+([^\n]+)/g) || [];
  const deploymentRecommendations = recMatches
    .slice(0, 3)
    .map((r) => r.replace(/^\d\.\s+/, "").trim());

  return {
    readme: readme.trim(),
    landingPageCopy,
    deploymentRecommendations:
      deploymentRecommendations.length > 0
        ? deploymentRecommendations
        : [
            `Ensure all environment variables are set in your deployment platform`,
            `Run \`${analysis.packageManager} run build\` before deploying`,
            `Set NODE_ENV=production in your deployment environment`,
          ],
    enhancedDescription: `${analysis.framework} application — ${analysis.description}`,
  };
}

function generateFallbackReadme(
  analysis: RepoAnalysis,
  repoName: string
): string {
  return `# ${repoName}

${analysis.description}

## Tech Stack
- **Framework**: ${analysis.framework}
- **Package Manager**: ${analysis.packageManager}
- **Backend**: ${analysis.backendType}

## Getting Started

\`\`\`bash
${analysis.packageManager} install
${analysis.packageManager} run dev
\`\`\`

## Deployment

Deploy to Vercel with one click. Ensure all environment variables are configured.
`;
}

export function generateFallbackResult(
  analysis: RepoAnalysis,
  repoName: string
): OpenAIAgentResult {
  return {
    readme: generateFallbackReadme(analysis, repoName),
    landingPageCopy: JSON.stringify({
      headline: `Ship ${repoName} to production`,
      subheadline: `${analysis.framework} app ready for deployment`,
      features: ["Fast deployment", "Production ready", "Easy configuration"],
    }),
    deploymentRecommendations: [
      `Ensure all environment variables are configured`,
      `Run \`${analysis.packageManager} run build\` before deploying`,
      `Set NODE_ENV=production in your deployment environment`,
    ],
    enhancedDescription: analysis.description,
  };
}
