import React from 'react';

/**
 * Footer Component
 * 
 * Professional footer matching the VK4WIP Radio Club design concept.
 * Features navy blue background with diagonal red accent stripe,
 * three-column layout on desktop, and responsive stacked layout on mobile.
 */
const Footer = () => {
  // Get version from Vite's define or fallback to development version
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative mt-auto bg-navy-900 text-white">
      {/* Diagonal Accent Stripe - Mirroring header but on opposite side */}
      <div className="absolute top-0 left-0 w-32 h-full bg-accent-600 transform -skew-x-12 -translate-x-16 opacity-30"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Branding */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
              {/* Logo Icon */}
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-navy-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
              <div className="font-bold text-lg">Race Tracker</div>
            </div>
            <p className="text-sm text-navy-200 max-w-xs mx-auto md:mx-0">
              Professional offline race management system for ultramarathon events.
            </p>
          </div>

          {/* Center Column - Quick Links */}
          <div className="text-center">
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-navy-200">
              <li>
                <a 
                  href="https://github.com/blewis-maker/RaceTrackers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors inline-flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://vk4wip.org.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors"
                >
                  VK4WIP Radio Club
                </a>
              </li>
            </ul>
          </div>

          {/* Right Column - System Info */}
          <div className="text-center md:text-right">
            <h3 className="font-semibold text-white mb-3">System Info</h3>
            <div className="space-y-2 text-sm text-navy-200">
              <div className="flex items-center justify-center md:justify-end space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Implemented by Brandon VK4BRW</span>
              </div>
              <div className="flex items-center justify-center md:justify-end space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Version {version}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Copyright */}
        <div className="mt-8 pt-6 border-t border-navy-800">
          <div className="text-center text-sm text-navy-300">
            <p>
              © {currentYear} VK4WIP Radio Club. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-navy-400">
              Designed for offline ultramarathon race management
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
