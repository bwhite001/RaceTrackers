import React from 'react';
import LandingPage from './LandingPage';

/**
 * Homepage Component
 * 
 * Main entry point for the application homepage.
 * Delegates to LandingPage component for actual rendering.
 * Maintains backward compatibility with existing imports.
 * 
 * @component
 */
const Homepage = () => {
  return <LandingPage />;
};

export default Homepage;
