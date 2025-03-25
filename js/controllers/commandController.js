/**
 * Command Controller
 * Processes commands and routes them to the appropriate handlers
 */
class CommandController {
    /**
     * Constructor for the CommandController
     * @param {Terminal} terminal - The terminal model instance
     * @param {TerminalView} terminalView - The terminal view instance
     * @param {PromptView} promptView - The prompt view instance
     */
    constructor(terminal, terminalView, promptView) {
        this.terminal = terminal;
        this.terminalView = terminalView;
        this.promptView = promptView;
        
        // Initialize available commands
        this.commands = {};
        
        // Register basic commands
        this.registerBasicCommands();
        
        // Register file system commands
        this.registerFileSystemCommands();
        
        // Update the prompt
        this.updatePrompt();
    }
    
    /**
     * Register basic terminal commands
     */
    registerBasicCommands() {
        // Import from basicCommands.js
        if (typeof registerBasicCommands === 'function') {
            registerBasicCommands(this);
        }
    }
    
    /**
     * Register file system commands
     */
    registerFileSystemCommands() {
        // Import from fileSystemCommands.js
        if (typeof registerFileSystemCommands === 'function') {
            registerFileSystemCommands(this);
        }
    }
    
    /**
     * Register a new command
     * @param {string} name - The name of the command
     * @param {function} handler - The function to handle the command
     * @param {string} description - A description of the command
     */
    registerCommand(name, handler, description) {
        this.commands[name] = {
            handler,
            description
        };
    }
    
    /**
     * Execute a command
     * @param {string} commandString - The command string to execute
     */
    executeCommand(commandString) {
        // Skip empty commands
        if (!commandString.trim()) {
            return;
        }
        
        // Add to command history
        this.terminal.addToHistory(commandString);
        
        // Display the command
        this.terminalView.addCommandOutput(
            commandString,
            '',
            this.terminal.getPrompt()
        );
        
        // Parse the command
        const command = new Command(commandString);
        
        // Execute the command if it exists
        if (this.commands[command.name]) {
            const output = this.commands[command.name].handler(command, this.terminal);
            if (output) {
                this.terminalView.addLine(output);
            }
        } else if (command.name) {
            this.terminalView.addError(`${command.name}: command not found`);
        }
        
        // Update the prompt (in case directory changed)
        this.updatePrompt();
    }
    
    /**
     * Update the terminal prompt
     */
    updatePrompt() {
        const promptText = this.terminal.getPrompt();
        this.promptView.updatePrompt(promptText);
    }
}
