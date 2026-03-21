import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Pagination } from '../components/shared/Pagination';
import { EmptyState } from '../components/shared/EmptyState';
import { Toast } from '../components/shared/Toast';
import { Button } from '../components/shared/Button';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Accepted" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('renders Sent badge', () => {
    render(<StatusBadge status="Sent" />);
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('renders Declined badge', () => {
    render(<StatusBadge status="Declined" />);
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });

  it('renders Pending badge', () => {
    render(<StatusBadge status="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders unknown status without crashing', () => {
    render(<StatusBadge status="Unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

// ─── EmptyState ──────────────────────────────────────────────────────────────
describe('EmptyState', () => {
  it('renders the icon', () => {
    render(<EmptyState icon="🔍" message="Nothing found" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('renders the message', () => {
    render(<EmptyState icon="📋" message="No offers yet" />);
    expect(screen.getByText('No offers yet')).toBeInTheDocument();
  });
});

// ─── Toast ────────────────────────────────────────────────────────────────────
describe('Toast', () => {
  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the message when toast is set', () => {
    render(<Toast toast={{ msg: 'Saved!', type: 'success' }} />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('renders error toast message', () => {
    render(<Toast toast={{ msg: 'Deleted', type: 'error' }} />);
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });
});

// ─── Button ──────────────────────────────────────────────────────────────────
describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Go</Button>);
    fireEvent.click(screen.getByText('Go'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handler = vi.fn();
    render(<Button disabled onClick={handler}>Go</Button>);
    fireEvent.click(screen.getByText('Go'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('renders as a button element', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────────
describe('Pagination', () => {
  it('renders all page buttons', () => {
    render(<Pagination page={1} totalPages={3} setPage={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls setPage with correct page on button click', () => {
    const setPage = vi.fn();
    render(<Pagination page={1} totalPages={3} setPage={setPage} />);
    fireEvent.click(screen.getByText('2'));
    expect(setPage).toHaveBeenCalledWith(2);
  });

  it('disables previous arrows on first page', () => {
    render(<Pagination page={1} totalPages={3} setPage={vi.fn()} />);
    const arrows = screen.getAllByText(/[«‹]/);
    arrows.forEach((arrow) => {
      expect(arrow.closest('button')).toBeDisabled();
    });
  });

  it('disables next arrows on last page', () => {
    render(<Pagination page={3} totalPages={3} setPage={vi.fn()} />);
    const arrows = screen.getAllByText(/[›»]/);
    arrows.forEach((arrow) => {
      expect(arrow.closest('button')).toBeDisabled();
    });
  });

  it('calls setPage with functional updater for previous arrow', () => {
    const setPage = vi.fn();
    render(<Pagination page={2} totalPages={3} setPage={setPage} />);
    fireEvent.click(screen.getByText('‹'));
    expect(setPage).toHaveBeenCalledWith(expect.any(Function));
  });
});
