// This is your new, secure backend API.
// It runs on Vercel's servers, not in the user's browser.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisOption, KpiSet, AnalysisResultData } from '../types.js'; // <-- Added .js
import { SINGLE_ANALYSIS_SCHEMA, COMPARISON_ANALYSIS_SCHEMA } from '../constants.js'; // <-- Added .js

// --- 1. YOUR PARAMETER LIST ---
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

// --- 2. YOUR GEMINI LOGIC ---
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// --- 3. UPDATED SYSTEM INSTRUCTION ---
// This is now much smarter and context-aware.
const SYSTEM_INSTRUCTION = `You are a world-class expert in digital advertising technology (AdTech).
Your task is to perform a strict, context-aware audit of ad requests against a master parameter list.

**Your analysis MUST follow these steps precisely:**

**Step 1: Determine Request Context**
- First, analyze the ad request JSON.
- Does it have an "app" object or a "site" object? This is the "Media Type".
- Does the "imp" array contain a "banner" object or a "video" object? This is the "Ad Type".

**Step 2: Filter the Master List**
- You will be given a "MASTER PARAMETER LIST".
- If Media Type is "app", you MUST ignore all parameters starting with "site_".
- If Media Type is "site", you MUST ignore all parameters starting with "app_".
- If Ad Type is "banner", you MUST ignore all parameters starting with "imp_video_".
- If Ad Type is "video", you MUST ignore all parameters starting with "imp_banner_".
- The remaining parameters form the "Relevant Parameter List".

**Step 3: Audit Missing Parameters**
- Audit the ad request JSON *only* against the "Relevant Parameter List" from Step 2.
- Generate the "missingParameters" array based *only* on this relevant, filtered list.
- DO NOT include irrelevant parameters (e.g., "imp_video_pos" in a banner request) in the final list.

**Step 4: Report Specific Values (tmax & schain)**
- You MUST find the "tmax" value. Report its value (e.g., "4968ms") or "Not Found" in the "tmax" field.
- You MUST check for "source.ext.schain". Report if it was "Found" (and how many hops/nodes) or "Not Found" in the "schain" field.

**Step 5: Generate Analysis**
- Provide a summary, forecast, and the missing parameter list as per the JSON schema.
- The summary MUST reflect the context (e.g., "For this app-banner request...").
- For comparisons, apply this same context-aware logic to both requests.

**Output Format:**
- Always provide your response in the requested JSON format. Do not include any markdown formatting.`;

// --- 4. UPDATED PROMPT BUILDER ---
// This now explicitly passes the master list to the AI in the prompt.
function buildPrompt(
    option: AnalysisOption, 
    kpiSets: KpiSet[], 
    adRequestInputs: string[]
): string {
    // Convert your array into a string for the prompt
    const paramListString = IMPORTANT_PARAMETERS_LIST.join(', ');

    const basePrompt = `Here is the master list of parameters to audit against:
MASTER PARAMETER LIST: [${paramListString}]
---
`;

    // The rest of the prompt logic is the same, but the AI will
    // now follow the new, stricter SYSTEM_INSTRUCTION when analyzing these.
    switch(option) {
        case AnalysisOption.SinglePublisher:
            return `${basePrompt}
            Analyze the following publisher's ad request based on your system instructions.
            KPIs:
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}
            
            Ad Request Body:
            \`\`\`json
            ${adRequestInputs[0]}
            \`\`\`
            
            Provide a summary, a forecasted revenue uplift, a list of RELEVANT missing parameters, and the tmax/schain details.`;
        
        case AnalysisOption.TopVsLowPerformer:
            return `${basePrompt}
            Analyze and compare the two requests based on your system instructions.
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
            
            First, provide a detailed analysis of the Low Performer's ad request (summary, forecast, relevant missing parameters, tmax, schain).
            Second, provide a comparison, identifying relevant parameters from the master list present in the Top Performer but missing from the Low Performer.`;

        case AnalysisOption.TwoPublishers:
            return `${basePrompt}
            Analyze and compare the ad requests from two different publishers based on your system instructions.
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
            
            First, provide a separate, detailed analysis for both Publisher A and B (summary, forecast, relevant missing parameters, tmax, schain).
            Second, provide a comparison, identifying relevant parameters from the master list present in A but missing from B.`;
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
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
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
        
        // Let's stick with the balanced model
        const model = 'gemini-2.5-flash'; 

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
        
        const parsedResult = JSON.parse(resultText);
        return res.status(200).json(parsedResult);

    } catch (e: any) {
        console.error("Error calling Gemini API:", e);
        
        // Provide more detailed error logging
        let errorMessage = "The analysis service failed.";
        if (e.message) {
            errorMessage = e.message;
        }
        if (e instanceof SyntaxError) {
             errorMessage = `Failed to parse AI response: ${e.message}`;
        }
        
        return res.status(500).json({ 
            error: "The analysis service failed.", 
            details: errorMessage 
        });
    }
}
