
import React from 'react';
import { AnalysisOption } from '../types';

interface OptionSelectorProps {
  selectedOption: AnalysisOption | null;
  onSelect: (option: AnalysisOption) => void;
}

const options = [
  { id: AnalysisOption.SinglePublisher, title: 'Single Publisher', description: 'Analyze one publisher\'s ad requests.' },
  { id: AnalysisOption.TopVsLowPerformer, title: 'Top vs. Low Performer', description: 'Compare a publisher\'s domains.' },
  { id: AnalysisOption.TwoPublishers, title: 'Two Publishers', description: 'Compare ad requests from two publishers.' },
];

const OptionSelector: React.FC<OptionSelectorProps> = ({ selectedOption, onSelect }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
    {options.map((option) => (
      <button
        key={option.id}
        onClick={() => onSelect(option.id)}
        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left h-full flex flex-col
          ${selectedOption === option.id 
            ? 'bg-slate-700/50 border-cyan-500 shadow-lg shadow-cyan-500/10' 
            : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
          }`}
      >
        <h3 className="text-xl font-semibold text-slate-100">{option.title}</h3>
        <p className="text-slate-400 mt-2 text-sm flex-grow">{option.description}</p>
      </button>
    ))}
  </div>
);

export default OptionSelector;
