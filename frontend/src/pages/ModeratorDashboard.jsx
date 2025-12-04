import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReportsDashboard from "./ReportsDashboard";

// Icons
const BookIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const AlertTriangleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const ShieldIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// --- Components & Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};
const tabContentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.4, ease: "easeInOut" } },
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-auto border border-gray-200 dark:border-gray-700"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <AlertTriangleIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg"
            >
              Confirm Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default function ModeratorDashboard() {
  const [stats, setStats] = useState({ totalQuizzes: 0, pendingReports: 0 });
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [error, setError] = useState(null);

  const [quizPage, setQuizPage] = useState(1);
  const [quizTotalPages, setQuizTotalPages] = useState(1);
  const [quizSearch, setQuizSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("quizwise-token");
    try {
      const [quizzesRes, statsRes] = await Promise.all([
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/moderator/quizzes?page=${quizPage}&search=${quizSearch}`,
          { headers: { "x-auth-token": token } }
        ),
        fetch(`${import.meta.env.VITE_API_URL}/api/moderator/stats`, {
          headers: { "x-auth-token": token },
        }),
      ]);

      // Check if responses are OK
      if (!quizzesRes.ok) {
        console.error(
          "Quizzes fetch failed:",
          quizzesRes.status,
          quizzesRes.statusText
        );
        throw new Error(`Failed to fetch quizzes: ${quizzesRes.status}`);
      }
      if (!statsRes.ok) {
        console.error(
          "Stats fetch failed:",
          statsRes.status,
          statsRes.statusText
        );
        throw new Error(`Failed to fetch stats: ${statsRes.status}`);
      }

      // Check content type to ensure we're getting JSON
      const quizzesContentType = quizzesRes.headers.get("content-type");
      const statsContentType = statsRes.headers.get("content-type");

      if (!quizzesContentType?.includes("application/json")) {
        console.error("Quizzes response is not JSON:", quizzesContentType);
        throw new Error("Server returned non-JSON response for quizzes");
      }
      if (!statsContentType?.includes("application/json")) {
        console.error("Stats response is not JSON:", statsContentType);
        throw new Error("Server returned non-JSON response for stats");
      }

      const quizzesData = await quizzesRes.json();
      const statsData = await statsRes.json();

      setQuizzes(quizzesData.quizzes || []);
      setQuizTotalPages(quizzesData.totalPages || 1);
      setStats(statsData);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Failed to fetch moderator data", error);
      setError(
        error.message || "Failed to load moderator data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [quizPage, quizSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeleteModal = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const token = localStorage.getItem("quizwise-token");
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/moderator/quizzes/${
        quizToDelete._id
      }`,
      {
        method: "DELETE",
        headers: { "x-auth-token": token },
      }
    );
    setShowDeleteModal(false);
    setQuizToDelete(null);
    fetchData();
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz?"
        message={`Are you sure you want to permanently delete "${quizToDelete?.title}"? This action cannot be undone.`}
      />
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Moderator Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and manage platform content to ensure a safe environment.
          </p>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Error Loading Data
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={itemVariants}
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                <BookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Quizzes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalQuizzes}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <ShieldIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending Reports
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingReports}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("quizzes")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "quizzes"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Quiz Management
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reports"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Reports
              </button>
            </nav>
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          <AnimatePresence mode="wait">
            {activeTab === "quizzes" && (
              <motion.div
                key="quizzes"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Search quizzes by title..."
                    onChange={(e) => {
                      setQuizSearch(e.target.value);
                      setQuizPage(1);
                    }}
                    className="w-full p-2 mb-4 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Created By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Questions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {quizzes.map((quiz) => (
                          <tr
                            key={quiz._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {quiz.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {quiz.createdBy?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {quiz.questions.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                              <Link
                                to={`/quiz/edit/${quiz._id}`}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => openDeleteModal(quiz)}
                                className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={quizPage}
                    totalPages={quizTotalPages}
                    onPageChange={setQuizPage}
                  />
                </div>
              </motion.div>
            )}
            {activeTab === "reports" && (
              <motion.div
                key="reports"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="p-4">
                  <ReportsDashboard />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
}
