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
        
        // Initialize event listeners
        this.initEventListeners();
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
                // Auto-completion could be implemented here
            }
        });
        
        // Focus input whenever user clicks anywhere on the terminal
        document.getElementById('terminal-container').addEventListener('click', () => {
            this.promptView.focus();
        });
    }
}
