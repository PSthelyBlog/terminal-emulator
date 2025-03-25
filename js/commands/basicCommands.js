/**
 * Basic Commands for the Terminal Emulator
 * This file defines basic terminal commands like echo, clear, help, etc.
 */

/**
 * Register basic commands with the command controller
 * @param {CommandController} commandController - The command controller instance
 */
function registerBasicCommands(commandController) {
    // echo command - display a message
    commandController.registerCommand('echo', (command) => {
        return command.args.join(' ');
    }, 'Display a message');
    
    // clear command - clear the terminal
    commandController.registerCommand('clear', (command, terminal) => {
        commandController.terminalView.clear();
        return '';
    }, 'Clear the terminal screen');
    
    // help command - display available commands
    commandController.registerCommand('help', (command, terminal) => {
        const commandsList = Object.keys(commandController.commands)
            .map(cmd => `${cmd} - ${commandController.commands[cmd].description}`)
            .join('\n');
        
        return 'Available commands:\n' + commandsList;
    }, 'Display help information');
    
    // pwd command - print working directory
    commandController.registerCommand('pwd', (command, terminal) => {
        return terminal.currentDirectory;
    }, 'Print working directory');
    
    // whoami command - print user name
    commandController.registerCommand('whoami', (command, terminal) => {
        return terminal.env.USER;
    }, 'Print current user name');
    
    // date command - print current date
    commandController.registerCommand('date', (command, terminal) => {
        return new Date().toString();
    }, 'Print current date and time');
    
    // env command - print environment variables
    commandController.registerCommand('env', (command, terminal) => {
        return Object.entries(terminal.env)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
    }, 'Print environment variables');
}
