/**
 * Terminal Model
 * Handles the core functionality and state of the terminal
 */
class Terminal {
    /**
     * Constructor for the Terminal model
     */
    constructor() {
        // Current working directory
        this.currentDirectory = '/';
        
        // Command history
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Environment variables
        this.env = {
            USER: 'user',
            HOME: '/',
            PATH: '/bin:/usr/bin',
            PWD: '/'
        };
        
        // Available commands (to be populated by the command controller)
        this.availableCommands = [];
        
        // Virtual file system (simple object-based representation)
        this.fileSystem = {
            '/': {
                type: 'directory',
                contents: {
                    'home': {
                        type: 'directory',
                        contents: {
                            'user': {
                                type: 'directory',
                                contents: {
                                    'documents': {
                                        type: 'directory',
                                        contents: {}
                                    },
                                    'welcome.txt': {
                                        type: 'file',
                                        content: 'Welcome to the Linux Terminal Emulator!'
                                    }
                                }
                            }
                        }
                    },
                    'bin': {
                        type: 'directory',
                        contents: {}
                    },
                    'usr': {
                        type: 'directory',
                        contents: {
                            'bin': {
                                type: 'directory',
                                contents: {}
                            }
                        }
                    }
                }
            }
        };
    }
    
    /**
     * Add a command to the history
     * @param {string} command - The command to add to history
     */
    addToHistory(command) {
        if (command.trim() !== '') {
            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;
        }
    }
    
    /**
     * Get the previous command from history
     * @returns {string} The previous command
     */
    getPreviousCommand() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.commandHistory[this.historyIndex];
        }
        return '';
    }
    
    /**
     * Get the next command from history
     * @returns {string} The next command
     */
    getNextCommand() {
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            return this.commandHistory[this.historyIndex];
        }
        this.historyIndex = this.commandHistory.length;
        return '';
    }
    
    /**
     * Get the current prompt string
     * @returns {string} The formatted prompt string
     */
    getPrompt() {
        return `${this.env.USER}:${this.currentDirectory} $ `;
    }
    
    /**
     * Change the current directory
     * @param {string} path - The path to change to
     * @returns {boolean} Success or failure
     */
    changeDirectory(path) {
        const resolvedPath = this.resolvePath(path);
        const node = this.getNodeAtPath(resolvedPath);
        
        if (node && node.type === 'directory') {
            this.currentDirectory = resolvedPath;
            this.env.PWD = resolvedPath;
            return true;
        }
        
        return false;
    }
    
    /**
     * Resolve a path (absolute or relative) to an absolute path
     * @param {string} path - The path to resolve
     * @returns {string} The resolved absolute path
     */
    resolvePath(path) {
        // Handle empty path
        if (!path) return this.currentDirectory;
        
        // Handle home directory shortcut
        if (path === '~') return '/home/user';
        if (path.startsWith('~/')) return '/home/user/' + path.substring(2);
        
        // Handle absolute paths
        if (path.startsWith('/')) return this.normalizePath(path);
        
        // Handle relative paths
        return this.normalizePath(`${this.currentDirectory}/${path}`);
    }
    
    /**
     * Normalize a path (remove . and .. segments, extra slashes)
     * @param {string} path - The path to normalize
     * @returns {string} The normalized path
     */
    normalizePath(path) {
        const parts = path.split('/').filter(p => p !== '');
        const result = [];
        
        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                if (result.length > 0) result.pop();
                continue;
            }
            result.push(part);
        }
        
        return '/' + result.join('/');
    }
    
    /**
     * Get the node (file or directory) at a specific path
     * @param {string} path - The path to the node
     * @returns {object} The node at the path, or null if not found
     */
    getNodeAtPath(path) {
        const parts = path.split('/').filter(p => p !== '');
        let node = this.fileSystem['/'];
        
        for (const part of parts) {
            if (!node.contents[part]) return null;
            node = node.contents[part];
        }
        
        return node;
    }
    
    /**
     * Set the available commands (called by command controller)
     * @param {Array<string>} commands - Array of command names
     */
    setAvailableCommands(commands) {
        this.availableCommands = commands;
    }
    
    /**
     * Auto-complete a command or path
     * @param {string} input - The current input to auto-complete
     * @returns {object} Object containing completion info
     */
    autoComplete(input) {
        // If input is empty, return null
        if (!input.trim()) {
            return { completed: null, matches: [] };
        }
        
        const parts = input.split(' ');
        
        // If only one part, try to complete a command
        if (parts.length === 1) {
            const result = this.autocompleteCommand(parts[0]);
            return result;
        } 
        
        // Otherwise try to complete a file or directory path
        else {
            // The last part is what we're trying to autocomplete
            const lastPart = parts[parts.length - 1];
            
            // Handle path autocompletion
            const result = this.autocompletePath(lastPart);
            if (result.completed !== null) {
                // Replace the last part with the completed path
                parts[parts.length - 1] = result.completed;
                return {
                    completed: parts.join(' '),
                    matches: result.matches
                };
            }
            return result;
        }
    }
    
    /**
     * Autocomplete a command
     * @param {string} partial - Partial command to complete
     * @returns {object} Object with completed command and matches
     */
    autocompleteCommand(partial) {
        // Find all matching commands
        const matches = this.availableCommands.filter(cmd => 
            cmd.startsWith(partial)
        );
        
        // If exactly one match, return it
        if (matches.length === 1) {
            return { 
                completed: matches[0],
                matches: []
            };
        } 
        // If multiple matches, find common prefix
        else if (matches.length > 1) {
            let commonPrefix = matches[0];
            for (let i = 1; i < matches.length; i++) {
                let j = 0;
                while (j < commonPrefix.length && j < matches[i].length &&
                       commonPrefix[j] === matches[i][j]) {
                    j++;
                }
                commonPrefix = commonPrefix.substring(0, j);
            }
            
            // Return completion info
            return {
                // Return common prefix only if it's longer than input
                completed: commonPrefix.length > partial.length ? commonPrefix : partial,
                matches: matches
            };
        }
        
        return { completed: null, matches: [] };
    }
    
    /**
     * Autocomplete a file or directory path
     * @param {string} partial - Partial path to complete
     * @returns {object} Object with completed path and matches
     */
    autocompletePath(partial) {
        // Expand home directory if needed
        let expandedPartial = partial;
        if (partial === '~') {
            expandedPartial = '/home/user';
        } else if (partial.startsWith('~/')) {
            expandedPartial = '/home/user/' + partial.substring(2);
        }
        
        // Handle absolute and relative paths
        let dirPath, fileName;
        if (expandedPartial.includes('/')) {
            // For paths with slashes, separate the directory part and file part
            dirPath = expandedPartial.substring(0, expandedPartial.lastIndexOf('/'));
            
            // If dirPath is empty, we're looking at root
            if (!dirPath && expandedPartial.startsWith('/')) {
                dirPath = '/';
            } else if (!dirPath) {
                dirPath = this.currentDirectory;
            } else if (!dirPath.startsWith('/')) {
                // Relative path
                dirPath = this.resolvePath(dirPath);
            }
            
            fileName = expandedPartial.substring(expandedPartial.lastIndexOf('/') + 1);
        } else {
            // For simple names, assume current directory
            dirPath = this.currentDirectory;
            fileName = expandedPartial;
        }
        
        // Resolve the directory path
        const dirNode = this.getNodeAtPath(dirPath);
        
        // If directory doesn't exist, can't autocomplete
        if (!dirNode || dirNode.type !== 'directory') {
            return { completed: null, matches: [] };
        }
        
        // Find all matching files/directories
        const matchingNames = Object.keys(dirNode.contents).filter(name => 
            name.startsWith(fileName)
        );
        
        // Enhanced matches with type info (for display in terminal)
        const matches = matchingNames.map(name => {
            const isDir = dirNode.contents[name].type === 'directory';
            return {
                name: name,
                type: isDir ? 'directory' : 'file',
                display: isDir ? name + '/' : name
            };
        });
        
        // If exactly one match, return the full path with trailing slash for directories
        if (matches.length === 1) {
            const isDir = matches[0].type === 'directory';
            const suffix = isDir ? '/' : '';
            
            // Construct the full path
            let completed;
            if (dirPath === '/') {
                completed = `/${matches[0].name}${suffix}`;
            } else {
                completed = `${dirPath}/${matches[0].name}${suffix}`;
            }
            
            // If the original input started with ~, convert back
            if (partial === '~') {
                completed = '~';
            } else if (partial.startsWith('~/')) {
                completed = '~' + completed.substring('/home/user'.length);
            }
            
            return { 
                completed: completed,
                matches: []
            };
        } 
        // If multiple matches, find common prefix
        else if (matches.length > 1) {
            let commonPrefix = matches[0].name;
            for (let i = 1; i < matches.length; i++) {
                let j = 0;
                while (j < commonPrefix.length && j < matches[i].name.length &&
                       commonPrefix[j] === matches[i].name[j]) {
                    j++;
                }
                commonPrefix = commonPrefix.substring(0, j);
            }
            
            // Construct path with common prefix
            let completed = null;
            if (commonPrefix.length > fileName.length) {
                if (dirPath === '/') {
                    completed = `/${commonPrefix}`;
                } else {
                    completed = `${dirPath}/${commonPrefix}`;
                }
                
                // If the original input started with ~, convert back
                if (partial === '~') {
                    completed = '~';
                } else if (partial.startsWith('~/')) {
                    completed = '~' + completed.substring('/home/user'.length);
                }
            } else {
                completed = partial;
            }
            
            return {
                completed: completed,
                matches: matches
            };
        }
        
        return { completed: null, matches: [] };
    }
    
    /**
     * List the contents of a directory
     * @param {string} path - The path to list
     * @returns {object} Object containing success status and content list
     */
    listDirectory(path) {
        const resolvedPath = this.resolvePath(path || '.');
        const node = this.getNodeAtPath(resolvedPath);
        
        if (!node || node.type !== 'directory') {
            return { success: false, message: `ls: cannot access '${path}': No such file or directory` };
        }
        
        return {
            success: true,
            contents: Object.keys(node.contents).map(name => ({
                name,
                type: node.contents[name].type
            }))
        };
    }
    
    /**
     * Read a file's contents
     * @param {string} path - The path to the file
     * @returns {object} Object containing success status and file content
     */
    readFile(path) {
        const resolvedPath = this.resolvePath(path);
        const node = this.getNodeAtPath(resolvedPath);
        
        if (!node) {
            return { success: false, message: `cat: ${path}: No such file or directory` };
        }
        
        if (node.type !== 'file') {
            return { success: false, message: `cat: ${path}: Is a directory` };
        }
        
        return { success: true, content: node.content };
    }
    
    /**
     * Create a new file
     * @param {string} path - The path to the new file
     * @param {string} content - The content of the new file
     * @returns {object} Object containing success status and message
     */
    createFile(path, content) {
        const resolvedPath = this.resolvePath(path);
        const dirPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/'));
        const fileName = resolvedPath.substring(resolvedPath.lastIndexOf('/') + 1);
        
        if (!fileName) {
            return { success: false, message: `touch: missing file operand` };
        }
        
        const dirNode = this.getNodeAtPath(dirPath);
        
        if (!dirNode || dirNode.type !== 'directory') {
            return { success: false, message: `touch: cannot touch '${path}': No such file or directory` };
        }
        
        dirNode.contents[fileName] = {
            type: 'file',
            content: content || ''
        };
        
        return { success: true };
    }
    
    /**
     * Create a new directory
     * @param {string} path - The path to the new directory
     * @returns {object} Object containing success status and message
     */
    createDirectory(path) {
        const resolvedPath = this.resolvePath(path);
        const parentPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/'));
        const dirName = resolvedPath.substring(resolvedPath.lastIndexOf('/') + 1);
        
        if (!dirName) {
            return { success: false, message: `mkdir: missing operand` };
        }
        
        const parentNode = this.getNodeAtPath(parentPath);
        
        if (!parentNode || parentNode.type !== 'directory') {
            return { success: false, message: `mkdir: cannot create directory '${path}': No such file or directory` };
        }
        
        if (parentNode.contents[dirName]) {
            return { success: false, message: `mkdir: cannot create directory '${path}': File exists` };
        }
        
        parentNode.contents[dirName] = {
            type: 'directory',
            contents: {}
        };
        
        return { success: true };
    }
}
