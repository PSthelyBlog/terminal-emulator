# Linux Terminal Emulator

A simple web-based Linux terminal emulator built with vanilla HTML, CSS, and JavaScript using the MVC (Model-View-Controller) design pattern.

## Features

- Simulates a basic Linux terminal environment in the browser
- Supports common Linux commands (ls, cd, pwd, mkdir, touch, cat, echo, clear, etc.)
- Command history navigation with up/down arrow keys
- Virtual file system with basic directory and file operations
- Customizable terminal appearance through CSS

## Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - can run locally

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/terminal-emulator.git
   cd terminal-emulator
   ```

2. Open `index.html` in your web browser

   You can simply double-click the file or use a local development server if you prefer.

## Usage

The terminal emulator supports the following commands:

- `help` - Display available commands
- `clear` - Clear the terminal screen
- `pwd` - Print working directory
- `ls [directory]` - List directory contents
- `cd [directory]` - Change directory
- `mkdir [directory]` - Create a directory
- `touch [file]` - Create an empty file
- `cat [file]` - Display file contents
- `echo [text]` - Display a message
- `echo [text] > [file]` - Write text to a file
- `rm [file]` - Remove a file
- `rm -r [directory]` - Remove a directory
- `whoami` - Display current user
- `date` - Display current date and time
- `env` - Display environment variables

## Project Structure

```
terminal-emulator/
├── css/
│   ├── reset.css        # CSS reset for consistent styling
│   └── styles.css       # Terminal styling
├── js/
│   ├── models/
│   │   ├── terminal.js  # Core terminal functionality
│   │   └── command.js   # Command parsing and representation
│   ├── views/
│   │   ├── terminalView.js # Output rendering
│   │   └── promptView.js   # Input handling
│   ├── controllers/
│   │   ├── inputController.js    # User input processing
│   │   └── commandController.js  # Command execution
│   ├── commands/
│   │   ├── basicCommands.js      # Basic terminal commands
│   │   └── fileSystemCommands.js # File system commands
│   └── app.js           # Application initialization
├── index.html           # Main HTML file
└── README.md            # This documentation
```

## Customization

You can customize the terminal appearance by modifying the `css/styles.css` file. Some examples:

- Change the background color: Modify the `background-color` property in the `body` selector
- Change the text color: Modify the `color` property in the `body` selector
- Change the font: Modify the `font-family` property in the `body` selector

## Extending Functionality

To add new commands:

1. Decide whether your command belongs in `basicCommands.js` or `fileSystemCommands.js` (or create a new file)
2. Add a new command registration:

```javascript
commandController.registerCommand('yourcommand', (command, terminal) => {
    // Implement your command logic here
    return 'Output of your command';
}, 'Description of your command');
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by real Linux terminal functionality
- Built with vanilla web technologies for simplicity and educational purposes
