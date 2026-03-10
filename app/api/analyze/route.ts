import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Fallback key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "DUMMY_KEY");

export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
        }

        let urlObj;
        try {
            urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        } catch (e) {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        let htmlContext = "";
        try {
            const response = await fetch(urlObj.href, {
                headers: { "User-Agent": "AI Portfolio Analyzer / 1.0" },
                signal: AbortSignal.timeout(5000)
            });
            if (response.ok) {
                const text = await response.text();
                const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
                const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    text.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
                const h1Matches = [...text.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map(m => m[1]).slice(0, 3);

                const imgMatches = [...text.matchAll(/<img[^>]+>/gi)].slice(0, 10);
                const imgsWithAlt = imgMatches.filter(m => m[0].includes('alt='));

                htmlContext = `
          Page Title: ${titleMatch ? titleMatch[1] : 'Not Found'}
          Meta Description: ${descMatch ? descMatch[1] : 'Not Found'}
          H1 Tags: ${h1Matches.length > 0 ? h1Matches.join(', ') : 'Not Found'}
          Images analyzed: ${imgMatches.length}. Images with alt tag: ${imgsWithAlt.length}
          Approximate HTML Size: ${text.length} bytes.
        `;
            } else {
                htmlContext = "Could not fetch page contents due to server block or error.";
            }
        } catch (fetchError) {
            console.warn("Fetch failed:", fetchError);
            htmlContext = "Could not fetch page contents (Timeout or network error).";
        }

        const prompt = `
You are an expert AI recruiter, UX/UI designer, and portfolio reviewer.
Analyze the following portfolio website context for: ${urlObj.href}

Technical context found in HTML:
${htmlContext}

Based on this, perform a deep audit tailored for a developer, designer, or freelancer portfolio. Return ONLY a valid JSON object matching exactly this structure, no markdown or text outside the JSON:

{
  "design": {
    "score": <number 1-100>,
    "feedback": "<Portfolio Design Review: evaluate layout, visual hierarchy, and UI quality>",
    "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
  },
  "seo": {
    "score": <number 1-100>,
    "feedback": "<Content Feedback: evaluate project descriptions, clarity, and storytelling>",
    "checks": {
      "title": "<Good/Bad - Evaluate if title is professional>",
      "description": "<Good/Bad - Evaluate if description clearly states their role>",
      "headings": "<Good/Bad - Evaluate if headings guide the narrative>",
      "images": "<Good/Bad - Evaluate if project images have context>"
    },
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  },
  "performance": {
    "score": <number 1-100>,
    "feedback": "<UX & Navigation: check if the portfolio is easy to navigate to find key projects or contact info>",
    "suggestions": ["<suggestion>"]
  },
  "accessibility": {
    "score": <number 1-100>,
    "feedback": "<accessibility feedback>",
    "suggestions": ["<suggestion>"]
  },
  "content": {
    "heroSuggestion": "<AI generated improved hero headline to attract clients/recruiters>",
    "ctaSuggestion": "<AI generated improved call to action string to get hired>",
    "checklist": ["<actionable checklist item 1 for Professional Impact>", "<checklist item 2>", "<checklist item 3>", "<checklist item 4>", "<checklist item 5>"]
  },
  "structure": {
    "hero": "Present" | "Missing",
    "about": "Present" | "Missing",
    "projects": "Present" | "Missing",
    "skills": "Present" | "Missing",
    "contact": "Present" | "Missing",
    "testimonials": "Present" | "Missing",
    "tips": ["<generate helpful tip 1 if any section is missing>", "<generate helpful tip 2>"]
  }
}
`;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "DUMMY_KEY") {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured. Please set it in your environment variables to enable dynamic AI analysis." },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiText = response.text();

        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not parse valid JSON from AI response");
        }

        const analysisData = JSON.parse(jsonMatch[0]);
        return NextResponse.json(analysisData);

    } catch (error: any) {
        console.error("Analysis API Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze website. " + (error.message || "") },
            { status: 500 }
        );
    }
}
