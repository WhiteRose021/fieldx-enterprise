import React from 'react';
import { Check, X, Send, Ban, Plus, PlaneTakeoff } from 'lucide-react';

const ProgressChevrons = ({ stages }) => {
  const getStatusStyle = (status, hasData = true) => {
    // If no data, return disabled style
    if (!hasData) {
      return {
        background: 'bg-gray-300',
        shadowColor: 'shadow-gray-300/20',
        isDisabled: true
      };
    }
    
    const style = {
      background: '',
      shadowColor: '',
      isDisabled: false
    };
    
    switch (status?.toUpperCase()) {
      case 'ΟΛΟΚΛΗΡΩΣΗ':
        style.background = 'bg-gradient-to-r from-emerald-500 to-emerald-600';
        style.shadowColor = 'shadow-emerald-500/20';
        break;
      case 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ':
        style.background = 'bg-gradient-to-r from-red-500 to-red-600';
        style.shadowColor = 'shadow-red-500/20';
        break;
      case 'ΑΠΟΣΤΟΛΗ':
        style.background = 'bg-gradient-to-r from-blue-500 to-blue-600';
        style.shadowColor = 'shadow-blue-500/20';
        break;
      case 'ΑΠΟΡΡΙΨΗ':
        style.background = 'bg-gradient-to-r from-orange-500 to-orange-600';
        style.shadowColor = 'shadow-orange-500/20';
        break;
      case 'ΝΕΟ':
        style.background = 'bg-gradient-to-r from-violet-500 to-violet-600';
        style.shadowColor = 'shadow-violet-500/20';
        break;
      default:
        style.background = 'bg-gray-300';
        style.shadowColor = 'shadow-gray-300/20';
        style.isDisabled = true;
    }
    return style;
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'ΟΛΟΚΛΗΡΩΣΗ':
        return <Check className="w-3 h-3 text-white" />;
      case 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ':
        return <X className="w-3 h-3 text-white" />;
      case 'ΑΠΟΣΤΟΛΗ':
        return <PlaneTakeoff className="w-3 h-3 text-white" />;
      case 'ΑΠΟΡΡΙΨΗ':
        return <Ban className="w-3 h-3 text-white" />;
      case 'ΝΕΟ':
        return <Plus className="w-3 h-3 text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center h-10 gap-[2px]">
      {stages.map((stage, index) => {
        const { background, shadowColor, isDisabled } = getStatusStyle(stage.status, stage.hasData);
        const icon = getStatusIcon(stage.status);
        
        return (
          <div key={stage.id} className="flex items-stretch">
            <div 
              className={`
                relative flex items-center h-10 pl-4 pr-8
                ${background}
                ${index === 0 ? 'rounded-l-md pl-5' : 'pl-8'}
                ${index === stages.length - 1 ? 'rounded-r-md' : ''}
                shadow-sm ${shadowColor}
                transition-all duration-300 ease-in-out
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-default'}
                group
              `}
            >
              <div className="flex items-center gap-2">
                {icon && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                    {icon}
                  </div>
                )}
                <span className="text-sm text-white font-medium whitespace-nowrap">
                  {stage.label}
                </span>
              </div>

              {/* Chevron */}
              {index < stages.length - 1 && (
                <>
                  {/* Shadow effect for depth */}
                  <div 
                    className={`
                      absolute right-[-15px] top-0 h-0 w-0 
                      border-l-[15px] border-y-[20px]
                      border-l-black/5
                      border-y-transparent z-10
                    `}
                  />
                  
                  {/* Main chevron */}
                  <div 
                    className={`
                      absolute right-[-14px] top-0 h-0 w-0 
                      border-l-[14px] border-y-[20px]
                      ${background.replace('bg-gradient-to-r', 'border-l')}
                      border-y-transparent z-20
                    `}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressChevrons;