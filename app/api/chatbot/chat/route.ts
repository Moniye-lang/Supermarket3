import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            ...history.map((msg: any) => ({
              role: msg.sender === "bot" ? "model" : "user",
              parts: [{ text: msg.text }]
            })),
            {
              role: "user",
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: "You are AM-Bot, a helpful and premium AI shopping assistant for AMstores, a high-end supermarket. Your tone is professional, friendly, and helpful. You know about shopping, orders, and delivery. If you don't know something specific about AMstores, be honest but helpful." }]
          }
        }),
      }
    );

    const data = await response.json() as any;
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

    return NextResponse.json({ response: botResponse });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ error: "Failed to get response from AI" }, { status: 500 });
  }
}
