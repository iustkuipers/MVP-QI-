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
};
