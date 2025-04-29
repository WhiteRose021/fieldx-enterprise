interface DataTableProps {
    columns: {
      header: string;
      minWidth?: string;
      align?: 'left' | 'right' | 'center';
    }[];
    children: React.ReactNode;
    isLoading?: boolean;
    emptyMessage?: string;
  }
  
  export const DataTable = ({
    columns,
    children,
    isLoading,
    emptyMessage = 'No data found',
  }: DataTableProps) => {
    return (
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`py-4 px-4 font-medium text-black dark:text-white ${
                      column.minWidth ? `min-w-[${column.minWidth}]` : ''
                    } ${column.align === 'right' ? 'text-right' : ''} ${
                      column.align === 'center' ? 'text-center' : ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                children || (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-4">
                      {emptyMessage}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };