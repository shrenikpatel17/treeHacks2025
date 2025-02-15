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
   const body = await req.json();
   const { connectionCoordinate, substationCoordinate, groupId, groupName } = body;

   // Convert string coordinates to number arrays
   function parseCoordinate(input: string) {
    // Remove the parentheses and split the string by comma
    const coords = input.replace(/[()]/g, '').split(',').map(Number);
    return coords;
}
  
   try {
       if (!groupId) {
           return NextResponse.json(
               { error: "groupId is required" },
               { status: 400 }
           );
       }

       const connection = parseCoordinate(connectionCoordinate);
       const substation = parseCoordinate(substationCoordinate);
       const substationLat = substation[0];
       const substationLong = substation[1];

       console.log(connection, substation);

       const esResponse = await esClient.index({
           index: 'potentlines',
           id: groupId,         
           document: {
               lineshape: {
                   type: "LineString",
                   coordinates: [connection, substation]
               },
           },
           refresh: "true",
       });

       // Index the substation point
       const substationResponse = await esClient.index({
           index: 'pointsofint',
           id: groupId,         
           document: {
               capacityleft: "1500",
               location: {
                   lat: substationLat,
                   lon: substationLong
               },
               poiname: groupName,
           },
           refresh: true
       });

       console.log("Indexed successfully:", esResponse);
       console.log("Indexed successfully:", substationResponse);
       return NextResponse.json({ success: true, esResponse }, { status: 200 });
   } catch (error) {
       console.error("Error indexing geo point:", error);
       return NextResponse.json({ error: "Failed to index location" }, { status: 500 });
   }
}


