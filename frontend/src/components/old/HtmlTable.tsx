// src/components/HtmlTable.tsx
import React from 'react';
import parse from 'html-react-parser';

interface HtmlTableProps {
  htmlContent: string;
  className?: string;
}

const HtmlTable: React.FC<HtmlTableProps> = ({ htmlContent, className = '' }) => {
  const cleanAndParseHtml = (html: string) => {
    // Remove escaped characters
    const cleanHtml = html
      .replace(/\\n/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\u003C/g, '<')
      .replace(/\\u003E/g, '>')
      .replace(/\\u2013/g, '–');  // For dashes
    
    return parse(cleanHtml);
  };

  return (
    <div className={`overflow-x-auto ${className} [&_table]:border-collapse [&_table]:w-full
      [&_th]:bg-gray-100 [&_th]:text-left [&_th]:p-3 [&_th]:font-semibold [&_th]:border [&_th]:border-gray-300
      [&_td]:p-3 [&_td]:border [&_td]:border-gray-300
      [&_tr:nth-child(odd)]:bg-white
      [&_tr:nth-child(even)]:bg-gray-50`}>
      {cleanAndParseHtml(htmlContent)}
    </div>
  );
};

export default HtmlTable;