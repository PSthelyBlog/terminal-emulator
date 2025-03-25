/**
 * File System Commands for the Terminal Emulator
 * This file defines commands for file system operations like ls, cd, touch, etc.
 */

/**
 * Register file system commands with the command controller
 * @param {CommandController} commandController - The command controller instance
 */
function registerFileSystemCommands(commandController) {
    // ls command - list directory contents
    commandController.registerCommand('ls', (command, terminal) => {
        const path = command.getArg(0, '.');
        const result = terminal.listDirectory(path);
        
        if (!result.success) {
            return result.message;
        }
        
        // Format the output based on options
        const isLong = command.hasOption('l');
        
        if (isLong) {
            return result.contents.map(item => {
                const type = item.type === 'directory' ? 'd' : '-';
                return `${type}rwxr-xr-x 1 ${terminal.env.USER} ${terminal.env.USER} 4096 Jan 1 12:00 ${item.name}${item.type === 'directory' ? '/' : ''}`;
            }).join('\n');
        } else {
            return result.contents.map(item => 
                `${item.name}${item.type === 'directory' ? '/' : ''}`
            ).join('  ');
        }
    }, 'List directory contents');
    
    // cd command - change directory
    commandController.registerCommand('cd', (command, terminal) => {
        const path = command.getArg(0, '~');
        const success = terminal.changeDirectory(path);
        
        if (!success) {
            return `cd: ${path}: No such file or directory`;
        }
        
        return '';
    }, 'Change the current directory');
    
    // mkdir command - create directory
    commandController.registerCommand('mkdir', (command, terminal) => {
        if (command.args.length === 0) {
            return 'mkdir: missing operand';
        }
        
        const path = command.getArg(0);
        const result = terminal.createDirectory(path);
        
        if (!result.success) {
            return result.message;
        }
        
        return '';
    }, 'Create a directory');
    
    // touch command - create an empty file
    commandController.registerCommand('touch', (command, terminal) => {
        if (command.args.length === 0) {
            return 'touch: missing file operand';
        }
        
        const path = command.getArg(0);
        const result = terminal.createFile(path, '');
        
        if (!result.success) {
            return result.message;
        }
        
        return '';
    }, 'Create an empty file');
    
    // cat command - display file contents
    commandController.registerCommand('cat', (command, terminal) => {
        if (command.args.length === 0) {
            return 'cat: missing file operand';
        }
        
        const path = command.getArg(0);
        const result = terminal.readFile(path);
        
        if (!result.success) {
            return result.message;
        }
        
        return result.content;
    }, 'Display file contents');
    
    // echo command with redirection - create a file with content
    const originalEchoHandler = commandController.commands['echo'].handler;
    commandController.registerCommand('echo', (command, terminal) => {
        const content = command.args.join(' ');
        
        // Check for redirection
        const redirectIndex = command.args.indexOf('>');
        if (redirectIndex !== -1 && redirectIndex < command.args.length - 1) {
            const filePath = command.args[redirectIndex + 1];
            const textContent = command.args.slice(0, redirectIndex).join(' ');
            
            const result = terminal.createFile(filePath, textContent);
            
            if (!result.success) {
                return result.message;
            }
            
            return '';
        }
        
        // Fall back to regular echo
        return originalEchoHandler(command);
    }, 'Display a message or write to a file');
    
    // rm command - remove a file
    commandController.registerCommand('rm', (command, terminal) => {
        if (command.args.length === 0) {
            return 'rm: missing operand';
        }
        
        const path = command.getArg(0);
        const resolvedPath = terminal.resolvePath(path);
        const parentPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/'));
        const fileName = resolvedPath.substring(resolvedPath.lastIndexOf('/') + 1);
        
        if (!fileName) {
            return `rm: cannot remove '${path}': Is a directory`;
        }
        
        const parentNode = terminal.getNodeAtPath(parentPath);
        
        if (!parentNode || !parentNode.contents[fileName]) {
            return `rm: cannot remove '${path}': No such file or directory`;
        }
        
        if (parentNode.contents[fileName].type === 'directory' && !command.hasOption('r')) {
            return `rm: cannot remove '${path}': Is a directory`;
        }
        
        delete parentNode.contents[fileName];
        return '';
    }, 'Remove files or directories');
}
