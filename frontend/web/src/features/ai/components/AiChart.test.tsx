import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createKippaTheme } from '@kippa/design-system';
import { AiChart } from './AiChart';
import { describe, expect, it } from 'vitest';

describe('AiChart', () => {
  it.each(['bar', 'line', 'pie'] as const)('renders a validated %s chart in the conversation', type => {
    const { container } = render(
      <ThemeProvider theme={createKippaTheme('light')}>
        <AiChart chart={{ type, title: `${type} spending`, labels: ['Food', 'Rent'], series: [{ label: 'EGP', data: [120, 800] }] }} />
      </ThemeProvider>,
    );
    expect(screen.getByText(`${type} spending`)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
