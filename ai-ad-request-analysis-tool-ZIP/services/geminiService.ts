import { AnalysisOption, KpiSet, AnalysisResultData } from '../types';

export async function analyzeAdRequests(
  option: AnalysisOption,
  kpiSets: KpiSet[],
  adRequestInputs: string[]
): Promise<AnalysisResultData> {
  
  // This calls your new backend file at /api/adAnalyzer.ts
  const response = await fetch('/api/adAnalyzer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      option,
      kpiSets,
      adRequestInputs,
    }),
  });

  if (!response.ok) {
    // Try to get a specific error message from the backend
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  // Return the JSON data from your API
  return response.json();
}
