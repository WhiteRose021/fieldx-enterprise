import useColorMode from "@/hooks/useColorMode";

const DarkModeSwitcher = () => {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <li>
      <label className="relative m-0 block h-7 w-14 rounded-full bg-[#EEEEEE] cursor-pointer">
        <input
          type="checkbox"
          onChange={() => {
            if (typeof setColorMode === "function") {
              setColorMode(colorMode === "light" ? "dark" : "light");
            }
          }}
          checked={colorMode === "dark"}
          className="absolute top-0 z-50 m-0 h-full w-full cursor-pointer opacity-0"
        />
        
        {/* Switch Track */}
        <div className="absolute inset-0 rounded-full transition-colors duration-300" />
        
        {/* Switch Thumb with Icons */}
        <div
          className={`absolute top-1 left-1 flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out ${
            colorMode === "dark" ? "translate-x-7 bg-blue-500" : "translate-x-0"
          }`}
        >
          {/* Sun icon for light mode */}
          <svg
            className={`h-3 w-3 transition-opacity duration-300 ${
              colorMode === "dark" ? "opacity-0" : "opacity-100"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
            />
            <circle cx="12" cy="12" r="4" />
          </svg>

          {/* Moon icon for dark mode */}
          <svg
            className={`h-3 w-3 transition-opacity duration-300 ${
              colorMode === "dark" ? "opacity-100" : "opacity-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </div>
      </label>
    </li>
  );
};

export default DarkModeSwitcher;