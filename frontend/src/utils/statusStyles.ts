// utils/statusStyles.ts
export const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ΟΛΟΚΛΗΡΩΣΗ':
        return 'bg-green-100 text-green-800';
      case 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ':
        return 'bg-red-100 text-red-800';
      case 'ΑΠΟΡΡΙΨΗ':
        return 'bg-yellow-100 text-yellow-800';
      case 'ΑΠΟΣΤΟΛΗ':
        return 'bg-blue-100 text-blue-800';
      case 'ΝΕΟ':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };