import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userPrompt } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides a pair of coordinates for an energy project at a given location, as well as a specificity score for the coordinates based on the location description provided by the user."
        },
        {
          role: "user",
          content: `Provide a pair of coordinates for an energy project at this location: "${userPrompt}". 
          ALSO PROVIDE A SPECIFICITY SCORE FOR THE COORDINATES BASED ON THE LOCATION. IT SHOULD BE BETWEEN 0 AND 10.
          THE HIGHER THE SCORE, THE MORE SPECIFIC, THE USER PROMPT WAS!!! Please also format the response as a coordinate | score. 
          FOLLOW THE EXAMPLES BELOW. DO NOT INCLUDE "User Prompt:" IN YOUR RESPONSE. PLEASE ADHERE STRICTLY TO THE FORMAT!!!

          EXAMPLE:
          -----------------
          User Prompt: "Near Stanford University"
          Output: (37.4275, -122.1697) | 8
          -----------------
          User Prompt: "Southern California"
          Output: (34.7071, -117.5852) | 4
          -----------------
          User Prompt: "Taliga Substation"
          Output: (37.8197, -122.4783) | 9.5
          `
        }
      ],
      temperature: 0.7,
    });

    const generatedResponse = response.choices[0].message.content || "Unable to provide coordinates.";

    return NextResponse.json({ res: generatedResponse }, { status: 200 });
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}