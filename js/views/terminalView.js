/**
 * Terminal View
 * Handles the rendering of the terminal output
 */
class TerminalView {
    /**
     * Constructor for the TerminalView
     * @param {string} elementId - The ID of the terminal output container element
     */
    constructor(elementId) {
        this.outputElement = document.getElementById(elementId);
        if (!this.outputElement) {
            throw new Error(`Element with ID ${elementId} not found`);
        }
    }
    
    /**
     * Clear the terminal output
     */
    clear() {
        this.outputElement.innerHTML = '';
    }
    
    /**
     * Add a new line to the terminal output
     * @param {string} text - The text to add
     * @param {string} className - Optional CSS class to apply to the line
     */
    addLine(text, className = '') {
        const line = document.createElement('div');
        line.className = `command-line ${className}`;
        line.textContent = text;
        this.outputElement.appendChild(line);
        this.scrollToBottom();
    }
    
    /**
     * Add a command and its output to the terminal
     * @param {string} command - The command that was executed
     * @param {string} output - The output of the command
     * @param {string} promptText - The prompt text
     */
    addCommandOutput(command, output, promptText) {
        // Add the command line with prompt
        this.addLine(`${promptText}${command}`);
        
        // Add the command output, if any
        if (output) {
            this.addLine(output);
        }
    }
    
    /**
     * Add an error message to the terminal
     * @param {string} message - The error message
     */
    addError(message) {
        this.addLine(message, 'error-text');
    }
    
    /**
     * Add a success message to the terminal
     * @param {string} message - The success message
     */
    addSuccess(message) {
        this.addLine(message, 'success-text');
    }
    
    /**
     * Add an info message to the terminal
     * @param {string} message - The info message
     */
    addInfo(message) {
        this.addLine(message, 'info-text');
    }
    
    /**
     * Scroll the terminal to the bottom
     */
    scrollToBottom() {
        const container = this.outputElement.parentElement;
        container.scrollTop = container.scrollHeight;
    }
}
