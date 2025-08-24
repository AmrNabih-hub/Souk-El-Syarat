/**
 * HomePage Component Tests
 * Integration testing for the main landing page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import HomePage from '../HomePage';

describe('HomePage', () => {
  it('renders without crashing', () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });

  it('renders main layout structure', () => {
    render(<HomePage />);
    
    // Check that main structural elements exist - HomePage uses div with min-h-screen
    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('min-h-screen');
  });

  it('displays hero section', () => {
    render(<HomePage />);
    
    // Look for Arabic hero text that should be in the homepage
    expect(screen.getByText('سوق السيارات')).toBeInTheDocument();
    expect(screen.getByText('الأول في مصر')).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    render(<HomePage />);
    
    // Check for navigation links using data-testid
    const links = screen.getAllByTestId('router-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('displays main action buttons', () => {
    render(<HomePage />);
    
    // Look for main Arabic action buttons
    expect(screen.getByText('تصفح السوق')).toBeInTheDocument();
    expect(screen.getByText('كن تاجراً')).toBeInTheDocument();
  });

  it('handles component lifecycle', () => {
    // Test mounting and unmounting
    const { unmount } = render(<HomePage />);
    expect(() => unmount()).not.toThrow();
  });

  it('renders responsive images', () => {
    render(<HomePage />);
    
    // Check for hero image
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('displays content sections', () => {
    render(<HomePage />);
    
    // Check that basic content is rendered
    const sections = document.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });
});
