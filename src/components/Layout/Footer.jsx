import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="mb-2 sm:mb-0">
            Implemented by Brandon VK4BRW
          </div>
          <div>
            Version v0.05
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
