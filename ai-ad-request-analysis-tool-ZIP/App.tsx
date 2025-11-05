
import React, { useState, useCallback } from 'react';
import { AnalysisOption, KpiSet, AnalysisResultData } from './types';
import { analyzeAdRequests } from './services/geminiService';
import Header from './components/Header';
import OptionSelector from './components/OptionSelector';
import AnalysisForm from './components/AnalysisForm';
import AnalysisResult from './components/AnalysisResult';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<AnalysisOption | null>(null);
  const [kpiSets, setKpiSets] = useState<KpiSet[]>([ { id: 1, adRequests: '', fillRate: '', cpm: '' } ]);
  const [adRequestInputs, setAdRequestInputs] = useState<string[]>(['']);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionSelect = (option: AnalysisOption) => {
    setSelectedOption(option);
    setAnalysisResult(null);
    setError(null);

    switch (option) {
      case AnalysisOption.SinglePublisher:
        setKpiSets([{ id: 1, adRequests: '', fillRate: '', cpm: '' }]);
        setAdRequestInputs(['']);
        break;
      case AnalysisOption.TopVsLowPerformer:
        setKpiSets([{ id: 1, adRequests: '', fillRate: '', cpm: '' }]);
        setAdRequestInputs(['', '']);
        break;
      case AnalysisOption.TwoPublishers:
        setKpiSets([
          { id: 1, adRequests: '', fillRate: '', cpm: '' },
          { id: 2, adRequests: '', fillRate: '', cpm: '' },
        ]);
        setAdRequestInputs(['', '']);
        break;
    }
  };
  
  const handleAnalyze = useCallback(async () => {
    if (!selectedOption) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeAdRequests(selectedOption, kpiSets, adRequestInputs);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? `Analysis failed: ${err.message}` : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOption, kpiSets, adRequestInputs]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <Header />
        <OptionSelector selectedOption={selectedOption} onSelect={handleOptionSelect} />

        {selectedOption && (
          <AnalysisForm
            option={selectedOption}
            kpiSets={kpiSets}
            setKpiSets={setKpiSets}
            adRequestInputs={adRequestInputs}
            setAdRequestInputs={setAdRequestInputs}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
        )}
        
        {isLoading && <div className="mt-8 flex justify-center"><Spinner /></div>}

        {error && <div className="mt-8 text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>}
        
        {analysisResult && !isLoading && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center text-cyan-400 mb-8">Analysis Results</h2>
            <AnalysisResult result={analysisResult} option={selectedOption!} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
