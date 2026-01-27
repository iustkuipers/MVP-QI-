/**
 * BacktestPage styles
 */

import { CSSProperties } from 'react';

export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  } as CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '16px',
  } as CSSProperties,

  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  } as CSSProperties,

  theoreticalFramework: {
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '16px',
    border: '1px solid #e0e0e0',
  } as CSSProperties,

  section: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  } as CSSProperties,

  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  } as CSSProperties,

  configPanel: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  } as CSSProperties,

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: '#333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  subSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    margin: '16px 0 8px 0',
  } as CSSProperties,

  labelInput: {
    padding: '6px 8px',
    fontSize: '13px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    maxWidth: '200px',
  } as CSSProperties,

  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #e0e0e0',
  } as CSSProperties,

  resultsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#333',
  } as CSSProperties,

  addComparisonButton: {
    padding: '10px 16px',
    marginTop: '16px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  } as CSSProperties,

  emptyMessage: {
    color: '#999',
    fontSize: '13px',
    fontStyle: 'italic',
    margin: '16px 0',
  } as CSSProperties,

  controlsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  } as CSSProperties,

  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
  } as CSSProperties,

  panelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  } as CSSProperties,

  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  } as CSSProperties,

  errorContainer: {
    padding: '16px',
    backgroundColor: '#ffebee',
    borderLeft: '4px solid #c62828',
    borderRadius: '4px',
  } as CSSProperties,

  copyButton: {
    padding: '8px 16px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  } as CSSProperties,
};
