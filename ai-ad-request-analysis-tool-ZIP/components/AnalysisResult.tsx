import React from 'react';
import { AnalysisResultData, AnalysisOption, SingleAnalysis, MissingParameter, ComparisonAnalysis } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CodeIcon } from './icons/CodeIcon';

interface AnalysisResultProps {
  result: AnalysisResultData;
  option: AnalysisOption;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const priorityStyles: { [key in MissingParameter['priority']]: string } = {
  High: 'bg-red-600/90 text-red-100',
  Mid: 'bg-amber-600/90 text-amber-100',
  Low: 'bg-sky-600/90 text-sky-100',
};

const AnalysisCard: React.FC<{ title: string; analysis: SingleAnalysis }> = ({ title, analysis }) => (
  <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 h-full flex flex-col">
    <h3 className="text-2xl font-bold text-cyan-400 mb-4">{title}</h3>
    <div className="mb-6 bg-slate-900/50 p-4 rounded-lg">
      <p className="text-slate-300 font-medium">Forecasted Revenue Uplift</p>
      <p className="text-3xl font-bold text-green-400">{formatCurrency(analysis.forecastedRevenue)}</p>
    </div>
    <div className="mb-6">
      <h4 className="font-semibold text-slate-300 mb-2">Summary</h4>
      <p className="text-slate-400 whitespace-pre-wrap">{analysis.summary}</p>
    </div>

    {/* --- START: NEW SECTION FOR TMAX AND SCHAIN --- */}
    <div className="mb-6">
      <h4 className="font-semibold text-slate-300 mb-3">Request Details</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-900/50 p-3 rounded-md">
          <p className="text-sm font-medium text-slate-400">Timeout (tmax)</p>
          <p className="text-lg font-mono text-cyan-300">{analysis.tmax || 'N/A'}</p>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-md">
          <p className="text-sm font-medium text-slate-400">Supply Chain (schain)</p>
          <p className="text-lg font-mono text-cyan-300">{analysis.schain || 'N/A'}</p>
        </div>
      </div>
    </div>
    {/* --- END: NEW SECTION --- */}

    <div className="flex-grow flex flex-col">
      <h4 className="font-semibold text-slate-300 mb-3 flex items-center gap-2"><XCircleIcon className="text-red-400" />Missing Parameters</h4>
      <div className="space-y-3 flex-grow overflow-y-auto pr-2">
        {analysis.missingParameters.length > 0 ? (
          analysis.missingParameters.map((param, index) => (
            <div key={index} className="bg-slate-900/50 p-3 rounded-md border-l-4 border-slate-600">
              <div className="flex justify-between items-start gap-2">
                <p className="font-mono text-amber-400 font-medium break-all">{param.parameter}</p>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${priorityStyles[param.priority]}`}>
                  {param.priority} Priority
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{param.description}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 text-slate-400 italic bg-slate-900/50 p-3 rounded-md">
            <CheckCircleIcon className="text-green-500" />
            <span>No significant parameters missing from the master list.</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const ComparisonCard: React.FC<{ title: string; summary: string; missingItems: string[], sourceLabel: string, targetLabel: string }> = ({ title, summary, missingItems, sourceLabel, targetLabel }) => (
  <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 mt-8">
    <h3 className="text-2xl font-bold text-teal-400 mb-4">{title}</h3>
    <div className="mb-6">
      <h4 className="font-semibold text-slate-300 mb-2">Comparison Summary</h4>
      <p className="text-slate-400 whitespace-pre-wrap">{summary}</p>
    </div>
    <div>
      <h4 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <CodeIcon />Parameters in {sourceLabel} but missing in {targetLabel}
      </h4>
      {missingItems.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {missingItems.map((item, index) => (
            <span key={index} className="bg-slate-700 text-amber-300 font-mono text-sm px-3 py-1 rounded-full">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-400 italic">
          <CheckCircleIcon className="text-green-500" />
          <span>No significant parameter discrepancies found.</span>
        </div>
      )}
    </div>
  </div>
);

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, option }) => {
  const renderContent = () => {
    switch (option) {
      case AnalysisOption.SinglePublisher:
        return result.analysisA && <AnalysisCard title="Publisher Analysis" analysis={result.analysisA} />;
      
      case AnalysisOption.TopVsLowPerformer:
        return (
          <>
            {result.analysisA && <AnalysisCard title="Low Performer Analysis" analysis={result.analysisA} />}
            {result.comparison && <ComparisonCard 
              title="Comparison: Low vs. Top Performer" 
              summary={result.comparison.comparisonSummary}
              missingItems={result.comparison.missingFromTarget}
              sourceLabel="Top Performer"
              targetLabel="Low Performer"
            />}
          </>
        );

      case AnalysisOption.TwoPublishers:
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {result.analysisA && <AnalysisCard title="Publisher A Analysis" analysis={result.analysisA} />}
              {result.analysisB && <AnalysisCard title="Publisher B Analysis" analysis={result.analysisB} />}
            </div>
            {result.comparison && <ComparisonCard 
              title="Comparison: Publisher B vs. Publisher A"
              summary={result.comparison.comparisonSummary}
              missingItems={result.comparison.missingFromTarget}
              sourceLabel="Publisher A"
              targetLabel="Publisher B"
             />}
          </>
        );
      default:
        return <p>Invalid analysis option.</p>;
    }
  };

  return <div className="space-y-8">{renderContent()}</div>;
};

export default AnalysisResult;
