// import Groq from "groq-sdk";
// import { headers } from "next/headers";
// import { z } from "zod";
// import { zfd } from "zod-form-data";

// const groq = new Groq();

// const schema = zfd.formData({
//   // input: z.union([zfd.text(), zfd.file()]),
//   input: z.union([zfd.text(), z.any()]),
//   message: zfd.repeatableOfType(
//     zfd.json(
//       z.object({
//         role: z.enum(["user", "assistant"]),
//         content: z.string(),
//       })
//     )
//   ),
// });

// export async function POST(request: Request) {
//   console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

//   const { data, success } = schema.safeParse(await request.formData());
//   if (!success) return new Response("Invalid request", { status: 400 });
  
//   let transcript: string;
//   if (data.input instanceof File) {
//     const result = await getTranscript(data.input);
//     if (!result) return new Response("Invalid audio", { status: 400 });
//     transcript = result;
//   } else {
//     transcript = data.input;
//   }


//   console.timeEnd(
//     "transcribe " + request.headers.get("x-vercel-id") || "local"
//   );
//   console.time(
//     "text completion " + request.headers.get("x-vercel-id") || "local"
//   );

//   const completion = await groq.chat.completions.create({
//     model: "llama3-8b-8192",
//     messages: [
//       {
//         role: "system",
//         content: `- You are Echo, a friendly and helpful voice assistant.
//         - Respond briefly to the user's request, and do not provide unnecessary information.
//         - If you don't understand the user's request, ask for clarification.
//         - You do not have access to up-to-date information, so you should not provide real-time data.
//         - You are not capable of performing actions other than responding to the user.
//         - Do not use markdown, emojis, or other formatting in your responses. Respond in a way easily spoken by text-to-speech software.
//         - User location is ${location()}.
//         - The current time is ${time()}.
//         - Your large language model is Llama 3, created by Meta, the 8 billion parameter version. It is hosted on Groq, an AI infrastructure company that builds fast inference technology.
//         - Your text-to-speech model is Sonic, created and hosted by Cartesia, a company that builds fast and realistic speech synthesis technology.
//         - You are built with Next.js and hosted on Vercel.`,
//       },
//       ...data.message,
//       {
//         role: "user",
//         content: transcript,
//       },
//     ],
//   });

//   const response = completion.choices[0].message.content;
//   console.timeEnd(
//     "text completion " + request.headers.get("x-vercel-id") || "local"
//   );

//   return new Response(JSON.stringify({ text: response }), {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
// }

// function location() {
//   const headersList = headers();

//   const country = headersList.get("x-vercel-ip-country");
//   const region = headersList.get("x-vercel-ip-country-region");
//   const city = headersList.get("x-vercel-ip-city");

//   if (!country || !region || !city) return "unknown";

//   return `${city}, ${region}, ${country}`;
// }

// function time() {
//   return new Date().toLocaleString("en-US", {
//     timeZone: headers().get("x-vercel-ip-timezone") || undefined,
//   });
// }

// async function getTranscript(input: File) {
//   try {
//     const { text } = await groq.audio.transcriptions.create({
//       file: input,
//       model: "whisper-large-v3",
//     });

//     return text.trim() || null;
//   } catch {
//     return null;
//   }
// }



import Groq from "groq-sdk";
import { headers } from "next/headers";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { ElevenLabsClient } from "elevenlabs";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY in environment variables");
}

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const groq = new Groq();

const schema = zfd.formData({
  input: z.union([zfd.text(), z.any()]),
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
  console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

  const { data, success } = schema.safeParse(await request.formData());
  if (!success) return new Response("Invalid request", { status: 400 });

  let transcript: string;
  if (data.input instanceof File) {
    const result = await getTranscript(data.input);
    if (!result) return new Response("Invalid audio", { status: 400 });
    transcript = result;
  } else {
    transcript = data.input;
  }

  console.timeEnd(
    "transcribe " + request.headers.get("x-vercel-id") || "local"
  );
  console.time(
    "text completion " + request.headers.get("x-vercel-id") || "local"
  );

  const completion = await groq.chat.completions.create({
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
        - Your text-to-speech model created and hosted by Elevenlabs.
        - You are built with Next.js and hosted on Vercel.`,
      },
      ...data.message,
      {
        role: "user",
        content: transcript,
      },
    ],
  });

  const response = completion.choices[0].message.content;
  console.timeEnd(
    "text completion " + request.headers.get("x-vercel-id") || "local"
  );

  // Generate the audio stream
  const audioBuffer = await createAudioStreamFromText(response);

  return new Response(
    JSON.stringify({ text: response, audioBuffer: audioBuffer.toString('base64') }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
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

async function getTranscript(input: File) {
  try {
    const { text } = await groq.audio.transcriptions.create({
      file: input,
      model: "whisper-large-v3",
    });

    return text.trim() || null;
  } catch {
    return null;
  }
}

export const createAudioStreamFromText = async (
  text: string
): Promise<Buffer> => {
  const audioStream = await client.generate({
    voice: "Jessica",
    model_id: "eleven_turbo_v2_5",
    text,
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};
