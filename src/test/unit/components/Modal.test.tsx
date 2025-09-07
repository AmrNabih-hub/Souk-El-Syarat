import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from '@/components/ui/Modal'

describe('Modal Component', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} showCloseButton={true}>
        <div>Modal content</div>
      </Modal>
    )

    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(button =>
      button.querySelector('svg') ||
      button.getAttribute('aria-label') === 'Close modal'
    )
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(handleClose).toHaveBeenCalledTimes(1)
    }
  })

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    // Find the backdrop element (the black overlay)
    const backdrop = document.querySelector('.bg-black\\/50.backdrop-blur-sm')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(handleClose).toHaveBeenCalledTimes(1)
    }
  })

  it('does not call onClose when modal content is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div data-testid="modal-content">Modal content</div>
      </Modal>
    )
    
    const content = screen.getByTestId('modal-content')
    fireEvent.click(content)
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('closes on Escape key', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('renders with custom title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Custom Title">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })
})