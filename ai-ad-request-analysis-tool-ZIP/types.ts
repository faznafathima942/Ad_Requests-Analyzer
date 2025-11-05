export enum AnalysisOption {
  SinglePublisher = 'single_publisher',
  TopVsLowPerformer = 'top_vs_low',
  TwoPublishers = 'two_publishers',
}

export interface KpiSet {
  id: number;
  adRequests: string;
  fillRate: string;
  cpm: string;
}

export interface MissingParameter {
  parameter: string;
  description: string;
  priority: 'High' | 'Mid' | 'Low';
}

export interface SingleAnalysis {
  summary: string;
  forecastedRevenue: number;
  missingParameters: MissingParameter[];
}

export interface ComparisonAnalysis {
  comparisonSummary: string;
  missingFromTarget: string[];
}

export interface AnalysisResultData {
  analysisA?: SingleAnalysis;
  analysisB?: SingleAnalysis;
  comparison?: ComparisonAnalysis;
}