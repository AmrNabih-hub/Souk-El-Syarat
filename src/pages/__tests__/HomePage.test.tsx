/**
 * HomePage Component Tests
 * Integration testing for the main landing page
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import HomePage from '../HomePage';
import { render as customRender } from '@/test/utils/test-utils';

describe('HomePage', () => {
  it('renders without crashing', () => {
    expect(() => customRender(<HomePage />)).not.toThrow();
  });

  it('renders main layout structure', () => {
    customRender(<HomePage />);
    
    // Check that main structural elements exist - HomePage uses div with min-h-screen
    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('min-h-screen');
  });

  it('displays hero section', () => {
    customRender(<HomePage />);
    
    // Look for Arabic hero text that should be in the homepage
    expect(screen.getByText('سوق السيارات')).toBeInTheDocument();
    expect(screen.getByText('الأول في مصر')).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    customRender(<HomePage />);
    
    // Check for navigation links using data-testid
    const links = screen.getAllByTestId('router-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('displays main action buttons', () => {
    customRender(<HomePage />);
    
    // Look for main Arabic action buttons
    expect(screen.getByText('تصفح السوق')).toBeInTheDocument();
    expect(screen.getByText('كن تاجراً')).toBeInTheDocument();
  });

  it('handles component lifecycle', () => {
    // Test mounting and unmounting
    const { unmount } = customRender(<HomePage />);
    expect(() => unmount()).not.toThrow();
  });

  it('renders responsive images', () => {
    customRender(<HomePage />);
    
    // Check for hero image
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('displays content sections', () => {
    customRender(<HomePage />);
    
    // Check that basic content is rendered
    const sections = document.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });
});
