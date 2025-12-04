 import React from 'react';

  export default function LoadingSpinner() {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
        <p className="text-lg font-semibold text-gray-700">Generating your quiz...</p>
        <p className="text-sm text-gray-500">The AI is warming up. This might take a moment.</p>
      </div>
    );
  }