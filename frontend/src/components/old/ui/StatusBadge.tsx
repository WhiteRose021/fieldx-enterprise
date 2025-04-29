interface StatusBadgeProps {
    status: 'success' | 'warning' | 'danger';
    children: React.ReactNode;
  }
  
  export const StatusBadge = ({ status, children }: StatusBadgeProps) => {
    const colors = {
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      danger: 'bg-danger/10 text-danger',
    };
  
    return (
      <span
        className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${colors[status]}`}
      >
        {children}
      </span>
    );
  };