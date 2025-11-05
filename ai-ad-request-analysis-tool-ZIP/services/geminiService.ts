// FIX: Implement Gemini service to analyze ad requests
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisOption, KpiSet, AnalysisResultData } from '../types';
import { SINGLE_ANALYSIS_SCHEMA, COMPARISON_ANALYSIS_SCHEMA } from '../constants';

// FIX: Initialize GoogleGenAI with API Key from environment variables.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

const SYSTEM_INSTRUCTION = `You are a world-class expert in digital advertising technology (AdTech), specializing in ad request optimization for publishers.
Your task is to analyze ad request data and provide actionable insights to maximize revenue.
- Analyze the provided ad request(s) and Key Performance Indicators (KPIs).
- Identify missing parameters that are crucial for ad targeting and monetization.
- For each missing parameter, provide a clear description and prioritize its implementation (High, Mid, Low).
- Forecast the potential revenue uplift in USD based on the provided KPIs and your analysis.
- When comparing two requests, identify parameters present in the source/high-performer but missing in the target/low-performer.
- Always provide your response in the requested JSON format. Do not include any markdown formatting like \`\`\`json.`;

function buildPrompt(option: AnalysisOption, kpiSets: KpiSet[], adRequestInputs: string[]): string {
    switch(option) {
        case AnalysisOption.SinglePublisher:
            return `Analyze the following publisher's ad request.
            KPIs:
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}
            
            Ad Request Body:
            \`\`\`
            ${adRequestInputs[0]}
            \`\`\`
            
            Provide a summary, a forecasted revenue uplift, and a list of missing parameters.`;
        
        case AnalysisOption.TopVsLowPerformer:
            return `Analyze the low-performing ad request and compare it against the top-performing one from the same publisher.
            Publisher KPIs (for the low performer):
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}

            Top Performer Ad Request (Source):
            \`\`\`
            ${adRequestInputs[0]}
            \`\`\`
            
            Low Performer Ad Request (Target):
            \`\`\`
            ${adRequestInputs[1]}
            \`\`\`
            
            First, provide a detailed analysis of the Low Performer's ad request (summary, forecast, missing parameters).
            Second, provide a comparison, identifying parameters present in the Top Performer's request but missing from the Low Performer's request.`;

        case AnalysisOption.TwoPublishers:
            return `Analyze and compare the ad requests from two different publishers, Publisher A and Publisher B.
            Publisher A KPIs:
            - Ad Requests: ${kpiSets[0].adRequests}
            - Fill Rate: ${kpiSets[0].fillRate}%
            - CPM: $${kpiSets[0].cpm}
            
            Publisher A Ad Request (Source):
            \`\`\`
            ${adRequestInputs[0]}
            \`\`\`
            
            Publisher B KPIs:
            - Ad Requests: ${kpiSets[1].adRequests}
            - Fill Rate: ${kpiSets[1].fillRate}%
            - CPM: $${kpiSets[1].cpm}

            Publisher B Ad Request (Target):
            \`\`\`
            ${adRequestInputs[1]}
            \`\`\`
            
            First, provide a separate, detailed analysis for both Publisher A and Publisher B.
            Second, provide a comparison, identifying parameters present in Publisher A's request but missing from Publisher B's request.`;
    }
}

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

    return {
        type: Type.OBJECT,
        properties,
        required,
    };
}


export async function analyzeAdRequests(
  option: AnalysisOption,
  kpiSets: KpiSet[],
  adRequestInputs: string[]
): Promise<AnalysisResultData> {
    const prompt = buildPrompt(option, kpiSets, adRequestInputs);
    const schema = getResponseSchema(option);

    // FIX: Using gemini-2.5-pro for complex text tasks and JSON output.
    const model = 'gemini-2.5-pro';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });
    
    // FIX: Extract text and parse as JSON.
    const resultText = response.text;
    try {
        const parsedResult = JSON.parse(resultText);
        return parsedResult as AnalysisResultData;
    } catch(e) {
        console.error("Failed to parse Gemini response:", resultText, e);
        throw new Error("The analysis returned an invalid format. Please try again.");
    }
}
