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


export async function POST(req: NextRequest) {
   // Fix: Get the body as an object instead of trying to destructure directly
   const body = await req.json();
   const { lat, long, projectId } = body;
  
   try {
       if (!projectId) {
           return NextResponse.json(
               { error: "projectId is required" },
               { status: 400 }
           );
       }


       const esResponse = await esClient.index({
           index: 'locations',  // Replace with your index name
           id: projectId,         // Use the MongoDB project _id as ES doc _id
           document: {
               geopoint: {
                   lat,
                   lon: long
               },
           },
           refresh: "true",
       });


       console.log("Indexed successfully:", esResponse);
       return NextResponse.json({ success: true, esResponse }, { status: 200 });
   } catch (error) {
       console.error("Error indexing geo point:", error);
       return NextResponse.json({ error: "Failed to index location" }, { status: 500 });
   }
}


