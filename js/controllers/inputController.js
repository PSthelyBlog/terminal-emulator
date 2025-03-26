/**
 * Input Controller
 * Handles user input events and interactions
 */
class InputController {
    /**
     * Constructor for the InputController
     * @param {PromptView} promptView - The prompt view instance
     * @param {CommandController} commandController - The command controller instance
     * @param {Terminal} terminal - The terminal model instance
     */
    constructor(promptView, commandController, terminal) {
        this.promptView = promptView;
        this.commandController = commandController;
        this.terminal = terminal;
        this.terminalView = commandController.terminalView;
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    /**
     * Display a list of completion matches in the terminal
     * @param {string} input - The current input
     * @param {Array} matches - The array of completion matches
     */
    displayCompletionMatches(input, matches) {
        // Add current command with prompt to output
        this.terminalView.addLine(`${this.terminal.getPrompt()}${input}`);
        
        if (matches.length === 0) {
            return;
        }
        
        // Format matches output based on type (command or file/directory)
        if (typeof matches[0] === 'string') {
            // These are command matches
            const matchesLine = matches.join('  ');
            this.terminalView.addLine(matchesLine);
        } else {
            // These are file/directory matches
            const matchesLine = matches.map(m => m.display).join('  ');
            this.terminalView.addLine(matchesLine);
        }
        
        // Re-display the prompt with the current (possibly updated) input
        this.terminalView.addLine(`${this.terminal.getPrompt()}${this.promptView.getInput()}`, 'no-newline');
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Handle Enter key press to execute commands
        this.promptView.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                
                const command = this.promptView.getInput();
                this.commandController.executeCommand(command);
                this.promptView.clearInput();
            }
            else if (event.key === 'ArrowUp') {
                event.preventDefault();
                
                const prevCommand = this.terminal.getPreviousCommand();
                if (prevCommand) {
                    this.promptView.setInput(prevCommand);
                }
            }
            else if (event.key === 'ArrowDown') {
                event.preventDefault();
                
                const nextCommand = this.terminal.getNextCommand();
                this.promptView.setInput(nextCommand);
            }
            else if (event.key === 'Tab') {
                event.preventDefault();
                
                // Get current input
                const input = this.promptView.getInput();
                
                // Try to auto-complete
                const result = this.terminal.autoComplete(input);
                
                // If completion available, update input
                if (result.completed !== null) {
                    this.promptView.setInput(result.completed);
                    
                    // Display matches if there are multiple and no perfect match
                    if (result.matches.length > 1) {
                        this.displayCompletionMatches(input, result.matches);
                    }
                }
            }
        });
        
        // Focus input whenever user clicks anywhere on the terminal
        document.getElementById('terminal-container').addEventListener('click', () => {
            this.promptView.focus();
        });
    }
}
