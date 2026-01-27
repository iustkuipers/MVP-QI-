/**
 * Global top navigation bar
 */

import React from 'react';
import styles from '../styles/navigation.module.css';

interface NavigationProps {
  currentPage: 'portfolio' | 'options';
  onNavigate: (page: 'portfolio' | 'options') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <h1 className={styles.title}>Quant Insights</h1>
        
        <div className={styles.navLinks}>
          <button
            className={`${styles.navLink} ${currentPage === 'portfolio' ? styles.active : ''}`}
            onClick={() => onNavigate('portfolio')}
          >
            Portfolio Lab
          </button>
          
          <button
            className={`${styles.navLink} ${currentPage === 'options' ? styles.active : ''}`}
            onClick={() => onNavigate('options')}
          >
            Options Sandbox
          </button>
        </div>
      </div>
    </nav>
  );
}
