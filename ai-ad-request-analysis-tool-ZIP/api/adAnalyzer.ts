// This is your new, secure backend API.
// It runs on Vercel's servers, not in the user's browser.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisOption, KpiSet, AnalysisResultData } from '../types.js';
import { SINGLE_ANALYSIS_SCHEMA, COMPARISON_ANALYSIS_SCHEMA } from '../constants.js';

// --- 1. YOUR PARAMETER LIST IS NOW HERE ---
// I have copied this from the "Important Parameters.txt" file you uploaded.
const IMPORTANT_PARAMETERS_LIST = [
    "_at", "app_cat", "app_content_id", "app_content_livestream", "app_content_producer_name",
    "app_content_title", "app_domain", "app_id", "app_name", "app_publisher_cat",
    "app_publisher_id", "app_publisher_name", "app_storeurl", "cur", "device_dnt",
    "device_geo_lat", "device_geo_lon", "device_geo_type", "device_ifa", "device_ip",
    "device_ipv6", "device_lmt", "device_ua", "id", "imp_banner_format", "imp_banner_format_h",
    "imp_banner_format_w", "imp_banner_pos", "imp_banner_w", "imp_bidfloor", "imp_bidfloorcur",
    "imp_id", "imp_secure", "imp_ssai", "imp_video_api", "imp_video_h", "imp_video_maxseq",
    "imp_video_minduration", "imp_video_podid", "imp_video_podseq", "imp_video_pos",
    "imp_video_protocols", "imp_video_slotinpod", "imp_video_startdelay", "imp_video_w",
    "mp_banner_h", "regs_coppa", "regs_ext_gdpr", "regs_ext_us_privacy", "site_cat",
    "site_domain", "site_id", "site_page", "site_publisher_id", "site_publisher_name",
    "site_ref", "source_ext_schain", "source_pchain", "tmax", "user_buyeruid",
    "user_ext_consent", "user_geo", "user_id"
];

// --- 2. YOUR GEMINI LOGIC MOVES HERE ---
// Note: Use process.env.GOOGLE_API_KEY (this is the secure way)
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// --- 3. THE SYSTEM INSTRUCTION IS UPDATED ---
// It now explicitly tells the AI to use your list.
const SYSTEM_INSTRUCTION = `You are a world-class expert in digital advertising technology (AdTech).
Your task is to analyze ad request(s) against a master list of important parameters.
- Analyze the provided ad request(s) and KPIs.
- Cross-reference the ad request(s) against the "IMPORTANT PARAMETER LIST" provided in the prompt.
- Identify ALL missing parameters from that master list.
- For each missing parameter, provide a clear description and prioritize it (High, Mid, Low).
- Also, specifically parse and report the 'tmax' (timeout) value if present.
- Also, specifically parse and report 'source.ext.schain' details (like 'complete' status and number of 'nodes').
- When comparing two requests, identify parameters from the master list that are present in the source but missing in the target.
- Always provide your response in the requested JSON format. Do not include any markdown formatting.`;

// --- 4. YOUR PROMPT BUILDER IS UPDATED ---
// It now INJECTS your parameter list into the prompt.
function buildPrompt(
    option: AnalysisOption, 
    kpiSets: KpiSet[], 
    adRequestInputs: string[]
): string {
    // Convert your array into a string for the prompt
    const paramListString = IMPORTANT_PARAMETERS_LIST.join(', ');

    const basePrompt = `Here is the master list of parameters to audit against:
IMPORTANT PARAMETER LIST: [${paramListString}]
---
`;

    switch(option) {
        case AnalysisOption.SinglePublisher:
            return `${basePrompt}
            Analyze the following publisher's ad request.
            KPIs:
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}
            
            Ad Request Body:
            \`\`\`json
            ${adRequestInputs[0]}
            \`\`\`
            
            Provide a summary, a forecasted revenue uplift, and a list of ALL missing parameters from the master list.
            Also report tmax and schain details.`;
        
        case AnalysisOption.TopVsLowPerformer:
            return `${basePrompt}
            Analyze the low-performing ad request and compare it against the top-performing one.
            Publisher KPIs (for the low performer):
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}

            Top Performer Ad Request (Source):
            \`\`\`json
            ${adRequestInputs[0]}
            \`\`\`
            
            Low Performer Ad Request (Target):
            \`\`\`json
            ${adRequestInputs[1]}
            \`\`\`
            
            First, provide a detailed analysis of the Low Performer's ad request (summary, forecast, all missing parameters from master list, tmax, schain).
            Second, provide a comparison, identifying parameters from the master list present in the Top Performer but missing from the Low Performer.`;

        case AnalysisOption.TwoPublishers:
            return `${basePrompt}
            Analyze and compare the ad requests from two different publishers, Publisher A and Publisher B.
            Publisher A KPIs:
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}
            
            Publisher A Ad Request (Source):
            \`\`\`json
            ${adRequestInputs[0]}
            \`\`\`
            
            Publisher B KPIs:
            - Ad Requests: ${kpiSets[1].adRequests}
            - Fill Rate: ${kpiSets[1].fillRate}%
            - CPM: $${kpiSets[1].cpm}

            Publisher B Ad Request (Target):
            \`\`\`json
            ${adRequestInputs[1]}
            \`\`\`
            
            First, provide a separate, detailed analysis for both Publisher A and B (summary, forecast, all missing parameters from master list, tmax, schain).
            Second, provide a comparison, identifying parameters from the master list present in A but missing from B.`;
    }
}

// Function to get the correct JSON schema based on the analysis option
function getResponseSchema(option: AnalysisOption) {
    const properties: any = {};
    const required: string[] = [];

    switch(option) {
        case AnalysisOption.SinglePublisher:
            properties.analysisA = SINGLE_ANALYSIS_SCHEMA;
            required.push('analysisA');
            break;
        case AnalysisOption.TopVsLowPerformer:
            properties.analysisA = SINGLE_ANALYSIS_SCHEMA;
            properties.comparison = COMPARISON_ANALYSIS_SCHEMA;
            required.push('analysisA', 'comparison');
            break;
        case AnalysisOption.TwoPublishers:
            properties.analysisA = SINGLE_ANALYSIS_SCHEMA;
            properties.analysisB = SINGLE_ANALYSIS_SCHEMA;
            properties.comparison = COMPARISON_ANALYSIS_SCHEMA;
            required.push('analysisA', 'analysisB', 'comparison');
            break;
    }
    return { type: Type.OBJECT, properties, required };
}

// --- 5. THIS IS THE MAIN API HANDLER ---
// Vercel will run this function when your frontend calls '/api/analyze'
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // Get the data from the frontend
    const { option, kpiSets, adRequestInputs } = req.body as {
        option: AnalysisOption,
        kpiSets: KpiSet[],
        adRequestInputs: string[]
    };

    if (!option || !kpiSets || !adRequestInputs) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const prompt = buildPrompt(option, kpiSets, adRequestInputs);
        const schema = getResponseSchema(option);
        const model = 'gemini-pro'; // Using Pro for this complex task

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const resultText = response.text;
        
        // Send the pure JSON result back to your frontend
        // We parse it and stringify it again to ensure it's valid JSON
        const parsedResult = JSON.parse(resultText);
        return res.status(200).json(parsedResult);

    } catch (e: any) {
        console.error("Error calling Gemini API:", e);
        return res.status(500).json({ 
            error: "The analysis service failed.", 
            details: e.message 
        });
    }

}


