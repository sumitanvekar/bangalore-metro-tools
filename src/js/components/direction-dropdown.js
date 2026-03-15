/**
 * Direction Dropdown Component - Uses simple-dropdown
 */
import './simple-dropdown.js';

export class DirectionDropdown extends HTMLElement {
    constructor() {
        super();
        this.selectedDirection = null;
        this.directions = [];
        this.isOpen = false;
        this.focusedIndex = -1;
        this.boundDocumentClick = null;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    disconnectedCallback() {
        // Clean up document listener
        if (this.boundDocumentClick) {
            document.removeEventListener('click', this.boundDocumentClick);
        }
    }

    setDirections(directions) {
        this.directions = directions;
        this.render();
        // Re-attach event listeners to new button element
        this.reattachButtonListeners();

        // Auto-select first direction if available
        if (directions.length > 0) {
            this.selectDirection(directions[0]);
        }
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || 'Select direction';
        const displayText = this.selectedDirection ? this.selectedDirection.label : placeholder;

        this.innerHTML = `
            <div class="direction-dropdown">
                <button type="button" class="dropdown-input" role="combobox" aria-expanded="false" aria-haspopup="listbox">
                    <span class="dropdown-text">${displayText}</span>
                    <svg class="dropdown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="6 9 12 15 18 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                    </svg>
                </button>
                <div class="dropdown-list hidden" role="listbox"></div>
            </div>
        `;

        this.button = this.querySelector('.dropdown-input');
        this.dropdown = this.querySelector('.dropdown-list');
        this.renderOptions();
    }

    renderOptions() {
        if (!this.dropdown) {
            console.warn('Dropdown element not found');
            return;
        }

        if (this.directions.length === 0) {
            this.dropdown.innerHTML = '<div class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-muted);">No directions available</div>';
            return;
        }

        this.dropdown.innerHTML = this.directions.map((direction, index) => `
            <div class="dropdown-item" role="option" data-index="${index}" data-value="${direction.value}">
                <div class="direction-content">
                    <div class="direction-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </div>
                    <span class="direction-label">${direction.label}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling to document
                this.selectDirection(this.directions[index]);
            });
        });
    }

    attachEventListeners() {
        this.button = this.querySelector('.dropdown-input');
        this.dropdown = this.querySelector('.dropdown-list');

        if (!this.button || !this.dropdown) return;

        // Button click
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDropdown();
        });

        // Keyboard navigation
        this.button.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Click outside to close (only attach once)
        if (!this.boundDocumentClick) {
            this.boundDocumentClick = (e) => {
                if (!this.contains(e.target)) {
                    this.closeDropdown();
                }
            };
            document.addEventListener('click', this.boundDocumentClick);
        }
    }

    reattachButtonListeners() {
        this.button = this.querySelector('.dropdown-input');
        this.dropdown = this.querySelector('.dropdown-list');

        if (!this.button || !this.dropdown) return;

        // Button click
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDropdown();
        });

        // Keyboard navigation
        this.button.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Document listener already attached, no need to re-add
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.isOpen = true;
        this.button.setAttribute('aria-expanded', 'true');
        this.dropdown.classList.remove('hidden');
        this.focusedIndex = -1;
    }

    closeDropdown() {
        this.isOpen = false;
        this.button.setAttribute('aria-expanded', 'false');
        this.dropdown.classList.add('hidden');
        this.focusedIndex = -1;
    }

    selectDirection(direction) {
        this.selectedDirection = direction;

        // Update button text
        const textElement = this.querySelector('.dropdown-text');
        if (textElement) {
            textElement.textContent = direction.label;
        }

        this.closeDropdown();

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('direction-selected', {
            detail: { direction },
            bubbles: true
        }));
    }

    handleKeydown(e) {
        if (!this.isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            this.openDropdown();
            return;
        }

        if (!this.isOpen) return;

        const items = this.dropdown.querySelectorAll('.dropdown-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, items.length - 1);
                this.updateFocus(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                this.updateFocus(items);
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this.focusedIndex >= 0 && this.directions[this.focusedIndex]) {
                    this.selectDirection(this.directions[this.focusedIndex]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.closeDropdown();
                this.button.focus();
                break;
        }
    }

    updateFocus(items) {
        items.forEach((item, index) => {
            if (index === this.focusedIndex) {
                item.classList.add('focused');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('focused');
            }
        });
    }

    getSelectedDirection() {
        return this.selectedDirection;
    }

    reset() {
        this.selectedDirection = null;
        this.directions = [];
        this.render();
    }
}

customElements.define('direction-dropdown', DirectionDropdown);
