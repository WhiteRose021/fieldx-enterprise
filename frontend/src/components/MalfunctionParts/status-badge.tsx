import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Send, 
  X 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  withIcon?: boolean;
  className?: string;
}

/**
 * A component for displaying malfunction status with consistent styling
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  withIcon = true,
  className = '' 
}) => {
  // Styles based on status
  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-100 text-green-800 border border-green-300",
      "ΑΠΟΣΤΟΛΗ": "bg-blue-100 text-blue-800 border border-blue-300",
      "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300",
      "ΑΠΟΡΡΙΨΗ": "bg-gray-100 text-gray-800 border border-gray-300",
      "ΝΕΟ": "bg-purple-100 text-purple-800 border border-purple-300",
      "ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ": "bg-yellow-100 text-yellow-800 border border-yellow-300",
      "ΑΚΥΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300"
    };
    return styles[status] || "bg-yellow-100 text-yellow-800 border border-yellow-300";
  };

  // Icons based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ΟΛΟΚΛΗΡΩΣΗ":
        return <CheckCircle2 className="flex-shrink-0" />;
      case "ΑΠΟΣΤΟΛΗ":
        return <Send className="flex-shrink-0" />;
      case "ΜΗ ΟΛΟΚΛΗΡΩΣΗ":
        return <AlertCircle className="flex-shrink-0" />;
      case "ΑΠΟΡΡΙΨΗ":
        return <X className="flex-shrink-0" />;
      case "ΝΕΟ":
        return <FileText className="flex-shrink-0" />;
      case "ΑΚΥΡΩΣΗ":
        return <XCircle className="flex-shrink-0" />;
      case "ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ":
        return <Clock className="flex-shrink-0" />;
      default:
        return <FileText className="flex-shrink-0" />;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs rounded-full",
    md: "px-3 py-1 text-sm rounded-full",
    lg: "px-4 py-1.5 text-base rounded-full"
  };

  const iconSizes = {
    sm: "h-3 w-3 mr-1",
    md: "h-4 w-4 mr-1.5",
    lg: "h-5 w-5 mr-2"
  };

  // Combine classes
  const badgeClasses = `inline-flex items-center font-medium ${sizeClasses[size]} ${getStatusStyle(status)} ${className}`;
  
  const Icon = withIcon ? React.cloneElement(getStatusIcon(status), { 
    className: iconSizes[size] 
  }) : null;

  return (
    <span className={badgeClasses}>
      {withIcon && Icon}
      {status}
    </span>
  );
};

export default StatusBadge;