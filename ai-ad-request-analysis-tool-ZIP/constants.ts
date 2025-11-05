// FIX: Add response schemas for Gemini API
import { Type } from '@google/genai';

export const SINGLE_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A brief summary of the analysis, highlighting key findings and potential improvements.',
    },
    forecastedRevenue: {
      type: Type.NUMBER,
      description: 'The estimated potential revenue uplift in USD if the missing parameters are implemented.',
    },
    missingParameters: {
      type: Type.ARRAY,
      description: 'A list of important parameters that are missing from the ad request.',
      items: {
        type: Type.OBJECT,
        properties: {
          parameter: {
            type: Type.STRING,
            description: 'The name of the missing parameter (e.g., "device.ifa").',
          },
          description: {
            type: Type.STRING,
            description: 'A brief explanation of what this parameter is and why it is important for ad revenue.',
          },
          priority: {
            type: Type.STRING,
            description: 'The priority for implementing this parameter, categorized as "High", "Mid", or "Low".',
            enum: ['High', 'Mid', 'Low'],
          },
        },
        required: ['parameter', 'description', 'priority'],
      },
    },
  },
  required: ['summary', 'forecastedRevenue', 'missingParameters'],
};

export const COMPARISON_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        comparisonSummary: {
            type: Type.STRING,
            description: "A summary comparing the two sets of ad requests, highlighting key differences and their potential impact on performance."
        },
        missingFromTarget: {
            type: Type.ARRAY,
            description: "A list of parameters present in the source/better performer's request but missing from the target/low performer's request.",
            items: {
                type: Type.STRING,
                description: "The name of the parameter."
            }
        }
    },
    required: ["comparisonSummary", "missingFromTarget"]
};
