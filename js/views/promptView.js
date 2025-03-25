/**
 * Prompt View
 * Handles the rendering and interaction with the terminal prompt
 */
class PromptView {
    /**
     * Constructor for the PromptView
     * @param {string} promptElementId - The ID of the prompt element
     * @param {string} inputElementId - The ID of the input element
     */
    constructor(promptElementId, inputElementId) {
        this.promptElement = document.getElementById(promptElementId);
        this.inputElement = document.getElementById(inputElementId);
        
        if (!this.promptElement || !this.inputElement) {
            throw new Error('Prompt or input element not found');
        }
    }
    
    /**
     * Update the prompt text
     * @param {string} text - The new prompt text
     */
    updatePrompt(text) {
        this.promptElement.textContent = text;
    }
    
    /**
     * Get the current input value
     * @returns {string} The current input value
     */
    getInput() {
        return this.inputElement.value;
    }
    
    /**
     * Clear the input field
     */
    clearInput() {
        this.inputElement.value = '';
    }
    
    /**
     * Set the input field value
     * @param {string} value - The value to set
     */
    setInput(value) {
        this.inputElement.value = value;
        
        // Move cursor to end of input
        this.inputElement.focus();
        const length = this.inputElement.value.length;
        this.inputElement.setSelectionRange(length, length);
    }
    
    /**
     * Focus the input field
     */
    focus() {
        this.inputElement.focus();
    }
    
    /**
     * Add event listener to the input field
     * @param {string} event - The event to listen for
     * @param {function} callback - The callback to execute when the event occurs
     */
    addEventListener(event, callback) {
        this.inputElement.addEventListener(event, callback);
    }
}
