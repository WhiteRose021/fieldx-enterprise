interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }
  
  export const SearchInput = ({
    value,
    onChange,
    placeholder = 'Search...',
  }: SearchInputProps) => {
    return (
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-3 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          className="w-full rounded border-[1.5px] border-stroke bg-transparent pl-10 pr-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  };