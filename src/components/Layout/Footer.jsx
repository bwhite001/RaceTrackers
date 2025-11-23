import React from 'react';

/**
 * Footer Component
 * 
 * Simplified footer with copyright, version, and implementer information.
 */
const Footer = () => {
  // Get version from package.json
  const version = '1.0.0';
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>
            © {currentYear} VK4WIP Radio Club. All rights reserved.
          </p>
          <p className="text-xs">
            Designed for offline ultramarathon race management
          </p>
          <p className="text-xs">
            Version {version} • Implemented by Brandon VK4BRW
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
