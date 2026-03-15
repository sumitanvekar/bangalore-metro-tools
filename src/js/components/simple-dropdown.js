/**
 * Simple Dropdown Component - Reusable for direction, filters, etc.
 * Matches station dropdown design
 */

export class SimpleDropdown extends HTMLElement {
    constructor() {
        super();
        this.selectedValue = null;
        this.options = [];
        this.isOpen = false;
        this.focusedIndex = -1;
    }

    connectedCallback() {
        this.render();
    }

    setOptions(options, defaultValue = null) {
        this.options = options;
        this.selectedValue = defaultValue || (options.length > 0 ? options[0].value : null);
        this.render();
        this.attachEventListeners();

        // Trigger initial change event
        if (this.selectedValue) {
            this.dispatchChangeEvent();
        }
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || 'Select option';
        const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
        const displayText = selectedOption ? selectedOption.label : placeholder;

        this.innerHTML = `
            <div class="simple-dropdown">
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
        if (this.options.length === 0) {
            this.dropdown.innerHTML = '<div class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-muted);">No options available</div>';
            return;
        }

        this.dropdown.innerHTML = this.options.map((option, index) => `
            <div class="dropdown-item" role="option" data-index="${index}" data-value="${option.value}">
                <span class="option-label">${option.label}</span>
            </div>
        `).join('');

        // Add click handlers
        this.dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectOption(this.options[index]);
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

        // Click outside to close
        const clickOutside = (e) => {
            if (!this.contains(e.target)) {
                this.closeDropdown();
            }
        };

        this._clickOutsideHandler = clickOutside;
        document.addEventListener('click', clickOutside);
    }

    disconnectedCallback() {
        if (this._clickOutsideHandler) {
            document.removeEventListener('click', this._clickOutsideHandler);
        }
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
        this.focusedIndex = this.options.findIndex(opt => opt.value === this.selectedValue);
    }

    closeDropdown() {
        this.isOpen = false;
        this.button.setAttribute('aria-expanded', 'false');
        this.dropdown.classList.add('hidden');
        this.focusedIndex = -1;
    }

    selectOption(option) {
        if (this.selectedValue === option.value) {
            this.closeDropdown();
            return;
        }

        this.selectedValue = option.value;

        // Update button text
        const textElement = this.querySelector('.dropdown-text');
        if (textElement) {
            textElement.textContent = option.label;
        }

        this.closeDropdown();
        this.dispatchChangeEvent();
    }

    dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('dropdown-change', {
            detail: { value: this.selectedValue },
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
                if (this.focusedIndex >= 0 && this.options[this.focusedIndex]) {
                    this.selectOption(this.options[this.focusedIndex]);
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

    getValue() {
        return this.selectedValue;
    }

    setValue(value) {
        const option = this.options.find(opt => opt.value === value);
        if (option) {
            this.selectOption(option);
        }
    }
}

customElements.define('simple-dropdown', SimpleDropdown);
