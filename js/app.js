/**
 * Main Application
 * Initializes the terminal emulator
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the terminal model
    const terminal = new Terminal();
    
    // Initialize the views
    const terminalView = new TerminalView('terminal-output');
    const promptView = new PromptView('terminal-prompt', 'terminal-input');
    
    // Initialize the command controller
    const commandController = new CommandController(terminal, terminalView, promptView);
    
    // Initialize the input controller
    const inputController = new InputController(promptView, commandController, terminal);
    
    // Display welcome message
    terminalView.addInfo('Welcome to the Linux Terminal Emulator!');
    terminalView.addInfo('Type "help" to see available commands.');
    
    // Focus the input field
    promptView.focus();
});
