
import React from 'react';
import { AnalysisOption, KpiSet } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface AnalysisFormProps {
  option: AnalysisOption;
  kpiSets: KpiSet[];
  setKpiSets: React.Dispatch<React.SetStateAction<KpiSet[]>>;
  adRequestInputs: string[];
  setAdRequestInputs: React.Dispatch<React.SetStateAction<string[]>>;
  onAnalyze: () => void;
  isLoading: boolean;
}

const getLabels = (option: AnalysisOption) => {
  switch (option) {
    case AnalysisOption.SinglePublisher:
      return [{ kpi: 'Publisher KPIs', adRequest: 'Publisher Ad Request(s)' }];
    case AnalysisOption.TopVsLowPerformer:
      return [
        { kpi: 'Low Performer KPIs', adRequest: 'Top Performer Ad Request(s)' },
        { kpi: '', adRequest: 'Low Performer Ad Request(s)' },
      ];
    case AnalysisOption.TwoPublishers:
      return [
        { kpi: 'Publisher A KPIs', adRequest: 'Publisher A Ad Request(s)' },
        { kpi: 'Publisher B KPIs', adRequest: 'Publisher B Ad Request(s)' },
      ];
    default:
      return [];
  }
};

const AnalysisForm: React.FC<AnalysisFormProps> = ({
  option,
  kpiSets,
  setKpiSets,
  adRequestInputs,
  setAdRequestInputs,
  onAnalyze,
  isLoading,
}) => {
  const labels = getLabels(option);

  const handleKpiChange = (index: number, field: keyof Omit<KpiSet, 'id'>, value: string) => {
    const newKpiSets = [...kpiSets];
    newKpiSets[index] = { ...newKpiSets[index], [field]: value };
    setKpiSets(newKpiSets);
  };

  const handleAdRequestChange = (index: number, value: string) => {
    const newAdRequestInputs = [...adRequestInputs];
    newAdRequestInputs[index] = value;
    setAdRequestInputs(newAdRequestInputs);
  };

  const isFormValid = () => {
    const kpisValid = kpiSets.every(k => k.adRequests && k.fillRate && k.cpm);
    const adRequestsValid = adRequestInputs.every(ar => ar.trim() !== '');
    return kpisValid && adRequestsValid;
  };

  return (
    <div className="bg-slate-800/60 p-6 md:p-8 rounded-xl border border-slate-700">
      <div className={`grid grid-cols-1 ${adRequestInputs.length > 1 ? 'lg:grid-cols-2' : ''} gap-8`}>
        {adRequestInputs.map((_, index) => (
          <div key={index} className="space-y-6">
            {kpiSets[index] && (
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">{labels[index]?.kpi || `KPIs ${index + 1}`}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input name={`adRequests-${index}`} label="Ad Requests" value={kpiSets[index].adRequests} onChange={(e) => handleKpiChange(index, 'adRequests', e.target.value)} />
                  <Input name={`fillRate-${index}`} label="Fill Rate (%)" value={kpiSets[index].fillRate} onChange={(e) => handleKpiChange(index, 'fillRate', e.target.value)} />
                  <Input name={`cpm-${index}`} label="CPM ($)" value={kpiSets[index].cpm} onChange={(e) => handleKpiChange(index, 'cpm', e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <label htmlFor={`adRequest-${index}`} className="block text-lg font-semibold text-cyan-400 mb-3">
                {labels[index]?.adRequest || `Ad Request(s) ${index + 1}`}
              </label>
              <textarea
                id={`adRequest-${index}`}
                rows={10}
                className="w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 text-slate-300 placeholder-slate-500"
                placeholder="Paste ad request(s) here..."
                value={adRequestInputs[index]}
                onChange={(e) => handleAdRequestChange(index, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={isLoading || !isFormValid()}
          className="inline-flex items-center gap-2 px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
          {!isLoading && <ArrowRightIcon />}
        </button>
      </div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const Input: React.FC<InputProps> = ({ label, name, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-400 mb-1">
      {label}
    </label>
    <input
      id={name}
      type="text"
      className="w-full bg-slate-900/70 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 text-slate-300"
      {...props}
    />
  </div>
);

export default AnalysisForm;
