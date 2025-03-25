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
