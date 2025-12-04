import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from './Button';

const RoleSelectionModal = ({ isOpen, userInfo, onRoleSelect, onClose }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: 'Student',
      title: 'Student',
      description: 'Join quizzes, track progress, and learn with AI assistance',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'Teacher',
      title: 'Teacher',
      description: 'Create quizzes, manage classes, and track student performance',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      await onRoleSelect(selectedRole);
    } catch (error) {
      console.error('Role selection error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {userInfo?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Choose your role to personalize your QuizWise experience
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-4 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === role.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setSelectedRole(role.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${role.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {role.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {role.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selectedRole === role.id
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedRole === role.id && (
                      <div className="w-full h-full rounded-full bg-white transform scale-50" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </div>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelectionModal;