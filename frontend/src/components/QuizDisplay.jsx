import React from "react";
import { Link } from "react-router-dom";
import { SpeakerIcon } from "./TextToSpeech";

export default function QuizDisplay({ quizData, onRetry }) {
  if (!quizData || quizData.length === 0) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-xl font-bold text-red-800">Generation Failed</h3>
        <p className="mt-2 text-red-600">
          Oops! The AI couldn't generate a quiz. This can happen sometimes.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
              Quiz Saved Successfully! 🎉
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Your quiz has been automatically saved to your quiz collection.
            </p>
          </div>
          <Link
            to="/teacher-dashboard"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            View My Quizzes
          </Link>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Your AI-Generated Quiz!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review the questions below. You'll be able to edit them soon.
        </p>
      </div>
      {quizData.map((question, index) => (
        <div
          key={index}
          className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex-1">
              {index + 1}. {question.question}
            </p>
            <SpeakerIcon text={question.question} size="md" />
          </div>
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  option === question.correct_answer
                    ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-semibold"
                    : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Generate Another Quiz
        </button>
        <Link
          to="/teacher-dashboard"
          className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          View All My Quizzes
        </Link>
      </div>
    </div>
  );
}
