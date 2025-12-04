import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import Button from './ui/Button';

const ReportModal = ({ isOpen, onClose, quiz, questionText = '' }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'inappropriate', label: 'Inappropriate Content', description: 'Contains offensive or inappropriate material' },
    { value: 'incorrect', label: 'Incorrect Information', description: 'Question or answer contains factual errors' },
    { value: 'spam', label: 'Spam or Low Quality', description: 'Low effort, repetitive, or irrelevant content' },
    { value: 'offensive', label: 'Offensive Language', description: 'Contains hate speech or discriminatory language' },
    { value: 'copyright', label: 'Copyright Violation', description: 'Uses copyrighted material without permission' },
    { value: 'other', label: 'Other', description: 'Issue not covered by other categories' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      alert('Please select a reason for reporting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('quizwise-token');
      const reportData = {
        quizId: quiz._id,
        questionText: questionText,
        reason: reason === 'other' ? customReason || 'other' : reason,
        description: description
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const result = await response.json();
      alert('Report submitted successfully. Our moderators will review it.');
      
      // Reset form
      setReason('');
      setCustomReason('');
      setDescription('');
      onClose();
      
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Quiz
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Help us maintain quality content
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Quiz Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Quiz: {quiz.title}
              </h3>
              {questionText && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Question:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                    "{questionText}"
                  </p>
                </div>
              )}
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What's the issue? *
              </label>
              <div className="space-y-2">
                {reportReasons.map((reportReason) => (
                  <label
                    key={reportReason.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      reason === reportReason.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reportReason.value}
                      checked={reason === reportReason.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {reportReason.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {reportReason.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Reason */}
            {reason === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please specify the issue
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe the specific issue..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </motion.div>
            )}

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context that might help our moderators understand the issue..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Please note:</p>
                <p>
                  False reports may result in account restrictions. Only report content that genuinely violates our community guidelines.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!reason || isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Report
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportModal;
