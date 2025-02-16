import { NextRequest, NextResponse } from "next/server";
import { Client } from "@elastic/elasticsearch";
import OpenAI from 'openai';

// Initialize Elasticsearch client
const esClient = new Client({
  node: "https://01310ba453334d729d5c28b2f492a4d3.us-west1.gcp.cloud.es.io:443",
  auth: {
    apiKey: process.env.ES_API_KEY || "",
  },
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Function to fetch results from Elasticsearch
const getElasticsearchResults = async (query: string) => {
  const esQuery = {
    query: {
      multi_match: {
        query,
        fields: ["body_content", "title"],
        fuzziness: "AUTO"
      },
    },
    size: 1, // Reduced from 2 to 1 to limit context
  };

  try {
    const response = await esClient.search({
      index: "search-caisoqueue",
      body: esQuery,
    });

    return response.hits.hits;
  } catch (error) {
    console.error('Elasticsearch error:', error);
    return [];
  }
};

// Function to construct context from Elasticsearch results
const createContextFromResults = (results: any[]) => {
  if (results.length === 0) return "";
  
  // Take only the first 500 characters of each document
  const truncatedContent = results[0]._source.body_content?.substring(0, 500) || "";
  return `Relevant context:\n${truncatedContent}\n`;
};

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1].content;

    // Search Elasticsearch with the user's query
    const elasticResults = await getElasticsearchResults(latestUserMessage);
    const searchContext = createContextFromResults(elasticResults);

    // Create the conversation with system message and context
    const conversationWithSystem = [
      {
        role: "system",
        content: `You are Link, a grid expert specializing in renewable energy projects. Use this context if relevant: ${searchContext}`
      },
      ...messages.slice(0, -1), // Previous conversation
      {
        role: "user",
        content: `Question: ${latestUserMessage}
        
        Please provide a helpful response using the context if relevant, or your general knowledge if not. PLEASE BE CONCISE WITH YOUR ANSWERS!!`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversationWithSystem,
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({ message: response.choices[0].message.content }, { status: 200 });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
