/**
 * Command Model
 * Represents a command to be executed by the terminal
 */
class Command {
    /**
     * Constructor for the Command model
     * @param {string} commandString - The full command string input by the user
     */
    constructor(commandString) {
        this.raw = commandString.trim();
        const parts = this.raw.split(/\s+/);
        
        // Extract the command name and arguments
        this.name = parts[0] || '';
        this.args = parts.slice(1);
        
        // Parse options (arguments starting with -)
        this.options = {};
        this.args = this.args.filter(arg => {
            if (arg.startsWith('-')) {
                // Handle combined short options like -la
                if (arg.startsWith('--')) {
                    // Long option
                    const optName = arg.substring(2);
                    this.options[optName] = true;
                } else {
                    // Short option(s)
                    for (let i = 1; i < arg.length; i++) {
                        this.options[arg[i]] = true;
                    }
                }
                return false;
            }
            return true;
        });
    }
    
    /**
     * Check if an option is present
     * @param {string} option - The option to check for
     * @returns {boolean} Whether the option is present
     */
    hasOption(option) {
        return !!this.options[option];
    }
    
    /**
     * Get a specific argument by index
     * @param {number} index - The index of the argument to get
     * @param {string} defaultValue - Default value to return if argument doesn't exist
     * @returns {string} The argument value or defaultValue
     */
    getArg(index, defaultValue = '') {
        return this.args[index] !== undefined ? this.args[index] : defaultValue;
    }
}
