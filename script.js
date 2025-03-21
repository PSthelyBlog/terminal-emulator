document.addEventListener('DOMContentLoaded', function() {
    const output = document.getElementById('output');
    const commandInput = document.getElementById('command-input');
    const promptElement = document.getElementById('prompt');
    const directoryElement = document.getElementById('directory');
    
    // Default file system structure
    const defaultFileSystem = {
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
                                    contents: {
                                        'notes.txt': {
                                            type: 'file',
                                            content: 'This is a sample text file.\nIt contains multiple lines.\nYou can edit it with the "edit" command.'
                                        },
                                        'todo.txt': {
                                            type: 'file',
                                            content: 'TODO LIST:\n- Learn more about terminal commands\n- Create a better terminal emulator\n- Have fun!'
                                        }
                                    }
                                },
                                'downloads': {
                                    type: 'directory',
                                    contents: {}
                                },
                                'hello.sh': {
                                    type: 'file',
                                    content: '#!/bin/bash\necho "Hello, World!"',
                                    executable: true
                                }
                            }
                        }
                    }
                },
                'etc': {
                    type: 'directory',
                    contents: {
                        'passwd': {
                            type: 'file',
                            content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash'
                        }
                    }
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
    
    // File system that will be initialized from IndexedDB or defaultFileSystem
    let fileSystem = null;
    
    // Command history
    const commandHistory = [];
    let historyIndex = -1;
    
    // Current directory
    let currentDirectory = '/home/user';
    
    // IndexedDB setup
    const dbName = 'terminalFileSystem';
    const dbVersion = 1;
    let db = null;
    
    // Initialize IndexedDB
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);
            
            request.onerror = (event) => {
                appendOutput('Failed to open IndexedDB. Using default file system.', 'error-text');
                resolve(false);
            };
            
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                if (!db.objectStoreNames.contains('fileSystem')) {
                    db.createObjectStore('fileSystem', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(true);
            };
        });
    }
    
    // Load file system from IndexedDB
    function loadFileSystem() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve(defaultFileSystem);
                return;
            }
            
            const transaction = db.transaction(['fileSystem'], 'readonly');
            const store = transaction.objectStore('fileSystem');
            const request = store.get('rootFileSystem');
            
            request.onerror = (event) => {
                appendOutput('Error loading file system from IndexedDB. Using default.', 'error-text');
                resolve(defaultFileSystem);
            };
            
            request.onsuccess = (event) => {
                if (request.result) {
                    resolve(request.result.data);
                } else {
                    // No data in IndexedDB yet, use default
                    resolve(defaultFileSystem);
                }
            };
        });
    }
    
    // Save file system to IndexedDB
    function saveFileSystem() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve(false);
                return;
            }
            
            const transaction = db.transaction(['fileSystem'], 'readwrite');
            const store = transaction.objectStore('fileSystem');
            const request = store.put({
                id: 'rootFileSystem',
                data: fileSystem
            });
            
            request.onerror = (event) => {
                appendOutput('Error saving file system to IndexedDB.', 'error-text');
                resolve(false);
            };
            
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }
    
    // Load current directory from IndexedDB
    function loadCurrentDirectory() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve('/home/user');
                return;
            }
            
            const transaction = db.transaction(['state'], 'readonly');
            const store = transaction.objectStore('state');
            const request = store.get('currentDirectory');
            
            request.onerror = (event) => {
                resolve('/home/user');
            };
            
            request.onsuccess = (event) => {
                if (request.result) {
                    resolve(request.result.data);
                } else {
                    resolve('/home/user');
                }
            };
        });
    }
    
    // Save current directory to IndexedDB
    function saveCurrentDirectory() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve(false);
                return;
            }
            
            const transaction = db.transaction(['state'], 'readwrite');
            const store = transaction.objectStore('state');
            const request = store.put({
                id: 'currentDirectory',
                data: currentDirectory
            });
            
            request.onerror = (event) => {
                resolve(false);
            };
            
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }
    
    // Initialize the application with IndexedDB
    async function initApp() {
        const dbInitialized = await initDB();
        
        if (dbInitialized) {
            fileSystem = await loadFileSystem();
            currentDirectory = await loadCurrentDirectory();
            appendOutput(`Loaded file system from IndexedDB. Current directory: ${currentDirectory}`, 'success-text');
        } else {
            fileSystem = defaultFileSystem;
            appendOutput('Using default file system.', 'success-text');
        }
        
        updatePrompt();
    }
    
    // Welcome message
    output.innerHTML = `<div class="success-text">Welcome to Linux Terminal Emulator v1.0.0</div>
<div>Type 'help' to see available commands.</div>
<div>Your filesystem changes are saved automatically using IndexedDB.</div>
`;
    
    // Update prompt with current directory
    function updatePrompt() {
        const shortDir = currentDirectory.replace('/home/user', '~');
        promptElement.textContent = `user@linux:${shortDir}$`;
        directoryElement.textContent = currentDirectory;
    }
    
    // Initialize the application
    initApp();
    
    // Get object at path
    function getObjectAtPath(path) {
        const resolvedPath = resolvePath(path);
        const parts = resolvedPath.split('/').filter(Boolean);
        
        let current = fileSystem['/'];
        
        if (resolvedPath === '/') {
            return current;
        }
        
        for (const part of parts) {
            if (!current.contents || !current.contents[part]) {
                return null;
            }
            current = current.contents[part];
        }
        
        return current;
    }
    
    // Resolve relative path to absolute path
    function resolvePath(path) {
        if (!path || path === '.') {
            return currentDirectory;
        }
        
        if (path.startsWith('/')) {
            // Absolute path
            return normalizePath(path);
        } else {
            // Relative path
            return normalizePath(`${currentDirectory}/${path}`);
        }
    }
    
    // Normalize path (handle .. and .)
    function normalizePath(path) {
        const parts = path.split('/').filter(Boolean);
        const result = [];
        
        for (const part of parts) {
            if (part === '..') {
                result.pop();
            } else if (part !== '.') {
                result.push(part);
            }
        }
        
        return '/' + result.join('/');
    }
    
    // Add text to output
    function appendOutput(text, className = '') {
        const div = document.createElement('div');
        if (className) {
            div.className = className;
        }
        div.textContent = text;
        output.appendChild(div);
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
    }
    
    // Add command to history
    function addToCommandHistory(cmdLine) {
        if (cmdLine.trim() && (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== cmdLine)) {
            commandHistory.push(cmdLine);
            if (commandHistory.length > 50) {
                commandHistory.shift();
            }
        }
        historyIndex = commandHistory.length;
    }
    
    // Reset filesystem to default
    async function resetFileSystem() {
        fileSystem = JSON.parse(JSON.stringify(defaultFileSystem));
        currentDirectory = '/home/user';
        updatePrompt();
        
        // Save to IndexedDB
        await saveFileSystem();
        await saveCurrentDirectory();
        
        appendOutput('File system has been reset to defaults.', 'success-text');
    }
    
    // Process command
    function processCommand(cmdLine) {
        if (!cmdLine.trim()) {
            return;
        }
        
        // Log command to output
        const commandDiv = document.createElement('div');
        commandDiv.className = 'command-history';
        const promptSpan = document.createElement('span');
        promptSpan.className = 'prompt';
        promptSpan.textContent = promptElement.textContent + ' ';
        commandDiv.appendChild(promptSpan);
        commandDiv.appendChild(document.createTextNode(cmdLine));
        output.appendChild(commandDiv);
        
        // Parse command and arguments
        const args = cmdLine.trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        
        // Process by command
        switch (command) {
            case 'clear':
            case 'cls':
                output.innerHTML = '';
                break;
                
            case 'ls':
                listDirectory(args[0] || currentDirectory);
                break;
                
            case 'cd':
                changeDirectory(args[0] || '/home/user');
                break;
                
            case 'pwd':
                appendOutput(currentDirectory);
                break;
                
            case 'cat':
                if (!args[0]) {
                    appendOutput('Usage: cat <filename>', 'error-text');
                } else {
                    catFile(args[0]);
                }
                break;
                
            case 'echo':
                appendOutput(args.join(' '));
                break;
                
            case 'mkdir':
                if (!args[0]) {
                    appendOutput('Usage: mkdir <directory_name>', 'error-text');
                } else {
                    makeDirectory(args[0]);
                }
                break;
                
            case 'touch':
                if (!args[0]) {
                    appendOutput('Usage: touch <filename>', 'error-text');
                } else {
                    touchFile(args[0]);
                }
                break;
                
            case 'rm':
                if (!args[0]) {
                    appendOutput('Usage: rm <filename>', 'error-text');
                } else {
                    removeFile(args[0], args.includes('-r') || args.includes('-rf'));
                }
                break;
                
            case 'resetfs':
                resetFileSystem();
                break;
                
            case 'help':
                showHelp();
                break;
                
            case 'date':
                appendOutput(new Date().toString());
                break;
                
            case 'whoami':
                appendOutput('user');
                break;
                
            case 'uname':
                if (args[0] === '-a') {
                    appendOutput('Linux Terminal Emulator 1.0.0 JavaScript x86_64');
                } else {
                    appendOutput('Linux');
                }
                break;
                
            case 'edit':
                if (!args[0]) {
                    appendOutput('Usage: edit <filename>', 'error-text');
                } else {
                    editFile(args[0]);
                }
                break;
                
            default:
                if (command.startsWith('./')) {
                    const scriptName = command.substring(2);
                    executeScript(scriptName);
                } else {
                    appendOutput(`Command not found: ${command}`, 'error-text');
                }
        }
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
    }
    
    // List directory
    function listDirectory(path) {
        const targetPath = resolvePath(path);
        const targetObj = getObjectAtPath(targetPath);
        
        if (!targetObj) {
            appendOutput(`ls: cannot access '${path}': No such file or directory`, 'error-text');
            return;
        }
        
        if (targetObj.type !== 'directory') {
            appendOutput(`ls: cannot list '${path}': Not a directory`, 'error-text');
            return;
        }
        
        const contents = targetObj.contents;
        const dirs = [];
        const files = [];
        
        for (const name in contents) {
            if (contents[name].type === 'directory') {
                dirs.push(name);
            } else {
                files.push(name);
            }
        }
        
        dirs.sort();
        files.sort();
        
        if (dirs.length + files.length === 0) {
            return;
        }
        
        const outputDiv = document.createElement('div');
        
        dirs.forEach(dir => {
            const span = document.createElement('span');
            span.className = 'dir-text';
            span.textContent = `${dir}/`;
            span.style.marginRight = '10px';
            outputDiv.appendChild(span);
        });
        
        files.forEach(file => {
            const span = document.createElement('span');
            span.className = 'file-text';
            span.textContent = file;
            span.style.marginRight = '10px';
            outputDiv.appendChild(span);
        });
        
        output.appendChild(outputDiv);
    }
    
    // Change directory
    function changeDirectory(path) {
        if (!path) {
            return;
        }
        
        const targetPath = resolvePath(path);
        const targetObj = getObjectAtPath(targetPath);
        
        if (!targetObj) {
            appendOutput(`cd: no such file or directory: ${path}`, 'error-text');
            return;
        }
        
        if (targetObj.type !== 'directory') {
            appendOutput(`cd: not a directory: ${path}`, 'error-text');
            return;
        }
        
        currentDirectory = targetPath;
        updatePrompt();
        
        // Save current directory to IndexedDB
        saveCurrentDirectory();
    }
    
    // Cat file
    function catFile(path) {
        const targetObj = getObjectAtPath(resolvePath(path));
        
        if (!targetObj) {
            appendOutput(`cat: ${path}: No such file or directory`, 'error-text');
            return;
        }
        
        if (targetObj.type !== 'file') {
            appendOutput(`cat: ${path}: Is a directory`, 'error-text');
            return;
        }
        
        appendOutput(targetObj.content);
    }
    
    // Make directory
    function makeDirectory(path) {
        const targetPath = resolvePath(path);
        const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
        const dirName = targetPath.substring(targetPath.lastIndexOf('/') + 1);
        
        if (!dirName) {
            appendOutput('mkdir: missing operand', 'error-text');
            return;
        }
        
        const parentObj = getObjectAtPath(parentDir);
        
        if (!parentObj) {
            appendOutput(`mkdir: cannot create directory '${path}': No such file or directory`, 'error-text');
            return;
        }
        
        if (parentObj.type !== 'directory') {
            appendOutput(`mkdir: cannot create directory '${path}': Not a directory`, 'error-text');
            return;
        }
        
        if (parentObj.contents[dirName]) {
            appendOutput(`mkdir: cannot create directory '${path}': File exists`, 'error-text');
            return;
        }
        
        parentObj.contents[dirName] = {
            type: 'directory',
            contents: {}
        };
        
        // Save changes to IndexedDB
        saveFileSystem();
        
        appendOutput(`Directory created: ${dirName}`, 'success-text');
    }
    
    // Touch file
    function touchFile(path) {
        const targetPath = resolvePath(path);
        const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
        const fileName = targetPath.substring(targetPath.lastIndexOf('/') + 1);
        
        if (!fileName) {
            appendOutput('touch: missing operand', 'error-text');
            return;
        }
        
        const parentObj = getObjectAtPath(parentDir);
        
        if (!parentObj) {
            appendOutput(`touch: cannot touch '${path}': No such file or directory`, 'error-text');
            return;
        }
        
        if (parentObj.type !== 'directory') {
            appendOutput(`touch: cannot touch '${path}': Not a directory`, 'error-text');
            return;
        }
        
        if (!parentObj.contents[fileName]) {
            parentObj.contents[fileName] = {
                type: 'file',
                content: ''
            };
            
            // Save changes to IndexedDB
            saveFileSystem();
        }
    }
    
    // Remove file
    function removeFile(path, recursive) {
        const targetPath = resolvePath(path);
        const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
        const fileName = targetPath.substring(targetPath.lastIndexOf('/') + 1);
        
        if (!fileName) {
            appendOutput('rm: missing operand', 'error-text');
            return;
        }
        
        const parentObj = getObjectAtPath(parentDir);
        
        if (!parentObj || !parentObj.contents[fileName]) {
            appendOutput(`rm: cannot remove '${path}': No such file or directory`, 'error-text');
            return;
        }
        
        const targetObj = parentObj.contents[fileName];
        
        if (targetObj.type === 'directory' && !recursive) {
            appendOutput(`rm: cannot remove '${path}': Is a directory`, 'error-text');
            return;
        }
        
        delete parentObj.contents[fileName];
        
        // Save changes to IndexedDB
        saveFileSystem();
    }
    
    // Edit file
    function editFile(path) {
        const targetPath = resolvePath(path);
        const targetObj = getObjectAtPath(targetPath);
        
        if (!targetObj) {
            // Create file if it doesn't exist
            touchFile(path);
            const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
            const fileName = targetPath.substring(targetPath.lastIndexOf('/') + 1);
            const parentObj = getObjectAtPath(parentDir);
            
            // Check again after touch
            if (!parentObj || !parentObj.contents[fileName]) {
                appendOutput(`edit: cannot edit '${path}': No such file or directory`, 'error-text');
                return;
            }
            
            const newTargetObj = parentObj.contents[fileName];
            openEditor(newTargetObj, path);
        } else if (targetObj.type === 'file') {
            openEditor(targetObj, path);
        } else {
            appendOutput(`edit: cannot edit '${path}': Is a directory`, 'error-text');
        }
    }
    
    // Open editor for file
    function openEditor(fileObj, path) {
        // Create editor
        const editorContainer = document.createElement('div');
        editorContainer.style.position = 'fixed';
        editorContainer.style.top = '50%';
        editorContainer.style.left = '50%';
        editorContainer.style.transform = 'translate(-50%, -50%)';
        editorContainer.style.width = '80%';
        editorContainer.style.height = '80%';
        editorContainer.style.backgroundColor = '#282c34';
        editorContainer.style.border = '1px solid #444';
        editorContainer.style.borderRadius = '5px';
        editorContainer.style.zIndex = '1000';
        editorContainer.style.display = 'flex';
        editorContainer.style.flexDirection = 'column';
        
        // Editor header
        const editorHeader = document.createElement('div');
        editorHeader.style.backgroundColor = '#333';
        editorHeader.style.padding = '8px';
        editorHeader.style.color = '#ddd';
        editorHeader.style.borderBottom = '1px solid #444';
        editorHeader.style.display = 'flex';
        editorHeader.style.justifyContent = 'space-between';
        editorHeader.innerHTML = `<div>Editing: ${path}</div><div>CTRL+S to save, ESC to exit</div>`;
        editorContainer.appendChild(editorHeader);
        
        // Editor content
        const editorContent = document.createElement('textarea');
        editorContent.value = fileObj.content;
        editorContent.style.backgroundColor = '#1e1e1e';
        editorContent.style.color = '#f8f8f2';
        editorContent.style.border = 'none';
        editorContent.style.padding = '10px';
        editorContent.style.fontFamily = 'Courier New, monospace';
        editorContent.style.resize = 'none';
        editorContent.style.flexGrow = '1';
        editorContent.style.width = '100%';
        editorContent.style.outline = 'none';
        editorContainer.appendChild(editorContent);
        
        // Add to body
        document.body.appendChild(editorContainer);
        editorContent.focus();
        
        // Handle keyboard shortcuts
        editorContent.addEventListener('keydown', function(e) {
            // Save with Ctrl+S
            if (e.key === 's' && e.ctrlKey) {
                e.preventDefault();
                fileObj.content = editorContent.value;
                
                // Save changes to IndexedDB
                saveFileSystem();
                
                appendOutput(`File saved: ${path}`, 'success-text');
                document.body.removeChild(editorContainer);
                commandInput.focus();
            }
            
            // Exit with ESC
            if (e.key === 'Escape') {
                document.body.removeChild(editorContainer);
                commandInput.focus();
            }
        });
    }
    
    // Execute script
    function executeScript(scriptName) {
        const targetObj = getObjectAtPath(`${currentDirectory}/${scriptName}`);
        
        if (!targetObj) {
            appendOutput(`./${scriptName}: No such file or directory`, 'error-text');
            return;
        }
        
        if (targetObj.type !== 'file') {
            appendOutput(`./${scriptName}: Is a directory`, 'error-text');
            return;
        }
        
        if (!targetObj.executable) {
            appendOutput(`./${scriptName}: Permission denied`, 'error-text');
            return;
        }
        
        // Simple script execution
        if (targetObj.content.includes('echo')) {
            const match = targetObj.content.match(/echo\s+"(.+?)"/);
            if (match && match[1]) {
                appendOutput(match[1]);
            }
        } else {
            appendOutput(`Executed: ${scriptName}`, 'success-text');
        }
    }
    
    // Show help
    function showHelp() {
        const helpText = `
Available commands:
  ls [path]         - List directory contents
  cd [path]         - Change directory
  pwd               - Print working directory
  cat <file>        - Show file contents
  echo <text>       - Display text
  mkdir <dir>       - Create directory
  touch <file>      - Create empty file
  rm [-r] <path>    - Remove file or directory (-r)
  clear, cls        - Clear screen
  date              - Show current date and time
  whoami            - Show current user
  uname [-a]        - Show system information
  edit <file>       - Edit file in simple editor
  ./script          - Execute script
  resetfs           - Reset file system to default state
  help              - Show this help
`;
        appendOutput(helpText);
    }
    
    // Event listener for input
    commandInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const command = commandInput.value;
            addToCommandHistory(command);
            processCommand(command);
            commandInput.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                commandInput.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Tab completion could be implemented here
        }
    });
    
    // Focus input when clicking terminal
    document.querySelector('.terminal').addEventListener('click', function() {
        commandInput.focus();
    });
    
    // Initial prompt setup
    updatePrompt();
});
