import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card as UICard, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';

export default function Card({ to, icon: Icon, title, description, gradient = false }) {
  const cardContent = (
    <UICard className={`cursor-pointer transition-all duration-300 ${gradient ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900' : ''}`}>
      <CardContent className="p-6">
        <motion.div 
          className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </motion.div>
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </UICard>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}