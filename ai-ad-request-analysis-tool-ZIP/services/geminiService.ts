// This file is now much simpler!
// It just calls your new secure backend API.
import { AnalysisOption, KpiSet, AnalysisResultData } from '../types';

export async function analyzeAdRequests(
  option: AnalysisOption,
  kpiSets: KpiSet[],
  adRequestInputs: string[]
): Promise<AnalysisResultData> {
  
  // Call your backend API at '/api/analyze'
  const response = await fetch('/api/analyze', {
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
