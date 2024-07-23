import Groq from "groq-sdk";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { headers } from "next/headers";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const schema = zfd.formData({
  input: zfd.text(),
  message: zfd.repeatableOfType(
    zfd.json(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
  ),
});

export async function POST(request: Request) {
  const { data, success } = schema.safeParse(await request.formData());
  if (!success) return new Response("Invalid request", { status: 400 });

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `- You are Echo, a friendly and helpful voice assistant.
        - Respond briefly to the user's request, and do not provide unnecessary information.
        - If you don't understand the user's request, ask for clarification.
        - You do not have access to up-to-date information, so you should not provide real-time data.
        - You are not capable of performing actions other than responding to the user.
        - Do not use markdown, emojis, or other formatting in your responses. Respond in a way easily spoken by text-to-speech software.
        - User location is ${location()}.
        - The current time is ${time()}.
        - Your large language model is Llama 3, created by Meta, the 8 billion parameter version. It is hosted on Groq, an AI infrastructure company that builds fast inference technology.
        - Your text-to-speech model is Sonic, created and hosted by Cartesia, a company that builds fast and realistic speech synthesis technology.
        - You are built with Next.js and hosted on Vercel.`,
      },
      ...data.message,
      {
        role: "user",
        content: data.input,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "No response";

  return new Response(JSON.stringify({
    text: content
  }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function location() {
  const headersList = headers();

  const country = headersList.get("x-vercel-ip-country");
  const region = headersList.get("x-vercel-ip-country-region");
  const city = headersList.get("x-vercel-ip-city");

  if (!country || !region || !city) return "unknown";

  return `${city}, ${region}, ${country}`;
}

function time() {
  return new Date().toLocaleString("en-US", {
    timeZone: headers().get("x-vercel-ip-timezone") || undefined,
  });
}
