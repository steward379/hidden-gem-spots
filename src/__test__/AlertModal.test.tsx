import React from 'react';
// import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertModal from '../components/AlertModal'; 

describe('AlertModal Component', () => {
  test('renders when isOpen is true', () => {
    render(<AlertModal isOpen={true} message="Test Message" />);
    const messageElement = screen.getByText('Test Message');
    expect(messageElement).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<AlertModal isOpen={false} message="Test Message" />);
    const messageElement = screen.queryByText('Test Message');
    expect(messageElement).not.toBeInTheDocument();
  });

  test('renders confirm button when showConfirmButton is true', () => {
    render(<AlertModal isOpen={true} message="Test Message" showConfirmButton={true} />);
    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toBeInTheDocument();
  });

  test('renders close button when showConfirmButton is false', () => {
    render(<AlertModal isOpen={true} message="Test Message" showConfirmButton={false} />);
    const closeButton = screen.getByText('確定');
    expect(closeButton).toBeInTheDocument();
  });

  test('close button calls onClose when clicked', () => {
    const mockOnClose = jest.fn();
    render(<AlertModal isOpen={true} message="Test Message" onClose={mockOnClose} />);
    const closeButton = screen.getByText('確定');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
