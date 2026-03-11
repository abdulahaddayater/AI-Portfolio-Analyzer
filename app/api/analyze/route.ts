import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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
You are an expert portfolio reviewer, senior UX designer, and tech hiring manager.

Analyze the following portfolio website and provide a professional evaluation.

Portfolio URL: ${urlObj.href}
Technical context found in HTML:
${htmlContext}

Evaluate the portfolio based on these categories:

1. Portfolio Design
* visual design quality
* layout consistency
* typography and spacing
* modern UI practices

2. UX and Navigation
* clarity of navigation
* user flow
* accessibility
* responsiveness

3. Portfolio Content
* hero section clarity
* about section strength
* skills section
* contact information

4. Project Presentation
* clear problem explanation
* solution explanation
* technologies used
* results or impact

5. Professional Impact
* how convincing the portfolio is for recruiters or clients
* clarity of developer/designer skills
* overall professionalism

Return ONLY a valid JSON object matching exactly this structure, no markdown or text outside the JSON:

{
  "overall_score": <number 0-100>,
  "design_score": <number 0-100>,
  "content_score": <number 0-100>,
  "ux_score": <number 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "missing_sections": ["<missing section 1>", "<missing section 2>"],
  "final_feedback": "<Provide a short professional summary explaining the overall portfolio quality>"
}
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "DUMMY_KEY") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please set it in your environment variables to enable dynamic AI analysis." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
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
