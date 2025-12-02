// --- Global State and Constants ---
let currentMode = null; // 'walter' or 'owuor'
const WALTER_MODE = 'walter'; // CLI Mode (Cyan Theme)
const OWUOR_MODE = 'owuor';   // Python REPL Mode (Fuchsia Theme)
let variableStore = {}; // Simple simulated variable store for Owuor mode
const HISTORY_LIMIT = 50;
let history = [];
let historyIndex = -1;

// --- DOM Elements (Declared globally, assigned in initAppListeners) ---
let floatingWindow, windowHeader, windowTitle, closeBtn, minimizeBtn, 
    minimizedBtnContainer, restoreBtn, terminalOutput, terminalInput, 
    terminalPrompt, terminalContactForm, terminalSendBtn, triggerWalter, 
    triggerOwuor, menuBtn, mobileMenu;

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements once the page is loaded
    floatingWindow = document.getElementById('floating-window');
    windowHeader = document.getElementById('window-header');
    windowTitle = document.getElementById('window-title');
    closeBtn = document.getElementById('close-btn');
    minimizeBtn = document.getElementById('minimize-btn');
    minimizedBtnContainer = document.getElementById('minimized-btn-container');
    restoreBtn = document.getElementById('restore-btn');
    terminalOutput = document.getElementById('terminal-output');
    terminalInput = document.getElementById('terminal-input');
    terminalPrompt = document.getElementById('terminal-prompt');
    terminalContactForm = document.getElementById('terminal-contact-form');
    terminalSendBtn = document.getElementById('terminal-send');
    triggerWalter = document.getElementById('trigger-walter');
    triggerOwuor = document.getElementById('trigger-owuor');
    menuBtn = document.getElementById('menu-btn');
    mobileMenu = document.getElementById('mobile-menu');

    // Initialize all event listeners and setup
    initAppListeners();
    
    // Initial setup for the terminal time
    updateTerminalTime();
    setInterval(updateTerminalTime, 1000);
});

/**
 * Initializes all core event listeners for the page and the terminal.
 */
function initAppListeners() {
    // 1. Mobile Menu Toggle
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        menuBtn.querySelector('i').classList.toggle('fa-bars');
        menuBtn.querySelector('i').classList.toggle('fa-times');
    });

    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            menuBtn.querySelector('i').classList.add('fa-bars');
            menuBtn.querySelector('i').classList.remove('fa-times');
        });
    });

    // 2. Terminal Mode Triggers
    triggerWalter.addEventListener('click', () => setMode(WALTER_MODE));
    triggerOwuor.addEventListener('click', () => setMode(OWUOR_MODE));

    // 3. Window Controls
    closeBtn.addEventListener('click', () => floatingWindow.classList.add('hidden'));
    minimizeBtn.addEventListener('click', minimizeWindow);
    restoreBtn.addEventListener('click', restoreWindow);

    // 4. Terminal Input Handler (Enter Key and History)
    terminalInput.addEventListener('keydown', handleTerminalInput);

    // 5. Contact Form Handler (Simulated Send)
    terminalSendBtn.addEventListener('click', handleSendContact);

    // 6. Window Dragging (Calling the helper function)
    makeDraggable(floatingWindow, windowHeader);
}

// --- Terminal Mode and UI Theming ---

/**
 * Sets the terminal mode and updates the UI theme accordingly.
 * @param {string} mode - 'walter' or 'owuor'
 */
function setMode(mode) {
    if (floatingWindow.classList.contains('hidden')) {
        floatingWindow.classList.remove('hidden');
        // If minimized, restore it
        if (!minimizedBtnContainer.classList.contains('hidden')) {
            restoreWindow();
        }
    }
    
    currentMode = mode;
    terminalContactForm.classList.add('hidden'); // Always hide form on mode switch
    terminalOutput.innerHTML = ''; // Clear output

    const internalTerminal = document.getElementById('internal-terminal');

    if (mode === WALTER_MODE) {
        // Cyan Theme for CLI
        windowTitle.textContent = 'Walter-CLI v1.1';
        terminalPrompt.textContent = 'cybrshujaa@walter-cli $';
        internalTerminal.style.color = '#06b6d4'; // text-cyan-500
        floatingWindow.classList.remove('terminal-glow-owuor');
        floatingWindow.classList.add('terminal-glow-walter');
        printToTerminal(`Welcome to Walter-CLI. Type '<span class="text-yellow-400">help</span>' for commands.`);
    } else if (mode === OWUOR_MODE) {
        // Fuchsia Theme for Python REPL
        windowTitle.textContent = 'Owuor-REPL Python 3.13.0';
        terminalPrompt.textContent = '>>>';
        internalTerminal.style.color = '#d946ef'; // text-fuchsia-500
        floatingWindow.classList.remove('terminal-glow-walter');
        floatingWindow.classList.add('terminal-glow-owuor');
        printToTerminal(`Python 3.13.0 (Wlan0tto Hacking Environment)\nType '<span class="text-yellow-400">help()</span>' for REPL commands or '<span class="text-yellow-400">exit()</span>' to switch to CLI.`);
    }
    terminalInput.focus();
}

/**
 * Updates the time displayed in the terminal initialization message.
 */
function updateTerminalTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        // Use 24-hour format
        timeElement.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
}

// --- Terminal Input & Command Handling ---

/**
 * Simple sanitization function to prevent XSS in output.
 * @param {string} str - The string to sanitize.
 * @returns {string} - The sanitized string.
 */
function sanitizeInput(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

/**
 * Handles the Enter key press in the terminal input field.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleTerminalInput(e) {
    if (e.key === 'Enter') {
        const input = terminalInput.value.trim();
        terminalInput.value = '';
        
        // Add to history
        if (input !== '' && (history.length === 0 || history[0] !== input)) {
            history.unshift(input);
            if (history.length > HISTORY_LIMIT) {
                history.pop();
            }
        }
        historyIndex = -1; // Reset history index

        // Display user input first
        const promptText = terminalPrompt.textContent;
        printToTerminal(`<span class="text-cyan-400">${promptText}</span> <span class="text-white">${sanitizeInput(input)}</span>`);

        if (input === '') {
            return;
        }

        if (currentMode === WALTER_MODE) {
            processWalterCommand(input);
        } else if (currentMode === OWUOR_MODE) {
            processOwuorCommand(input);
        }
        
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        if (e.key === 'ArrowUp' && historyIndex < history.length - 1) {
            historyIndex++;
        } else if (e.key === 'ArrowDown' && historyIndex > -1) {
            historyIndex--;
        }

        if (historyIndex >= 0 && historyIndex < history.length) {
            terminalInput.value = history[historyIndex];
        } else if (historyIndex === -1) {
            terminalInput.value = '';
        }
    }
}

/**
 * Handles the simulated sending of the contact form.
 */
function handleSendContact() {
    const name = document.getElementById('terminal-name').value.trim();
    const email = document.getElementById('terminal-email').value.trim();
    const message = document.getElementById('terminal-message').value.trim();

    if (!name || !email || !message) {
        printToTerminal('<span class="text-red-400">ERROR: All fields must be filled for secure transmission.</span>');
        return;
    }

    // Simple email validation check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        printToTerminal('<span class="text-red-400">ERROR: Invalid email format. Transmission aborted.</span>');
        return;
    }

    // Simulate sending time
    terminalSendBtn.disabled = true;
    terminalSendBtn.textContent = 'Transmitting...';

    setTimeout(() => {
        printToTerminal(`\n<span class="text-green-400">>> TRANSMISSION SUCCESSFUL <<</span>`);
        printToTerminal(`Target: owuorwolta@gmail | Source: ${sanitizeInput(email)}`);
        printToTerminal(`Message Length: ${message.length} bytes. Await reply shortly.\n`);
        
        // Reset form and UI
        document.getElementById('terminal-name').value = '';
        document.getElementById('terminal-email').value = '';
        document.getElementById('terminal-message').value = '';
        terminalContactForm.classList.add('hidden');
        terminalSendBtn.disabled = false;
        terminalSendBtn.textContent = 'Execute (Send)';
        terminalInput.focus();
    }, 2000); // 2 second delay for realism
}


// --- Command Processors (Dummy and Simulated) ---

/**
 * Processes commands for Walter (CLI) Mode.
 * @param {string} command - The user's input command.
 */
function processWalterCommand(command) {
    const cmd = command.toLowerCase().trim();
    let response = '';

    // Hide form before processing a new command that isn't 'contact'
    if (cmd !== 'contact') {
        terminalContactForm.classList.add('hidden');
    }

    switch (cmd) {
        case 'help':
            response = `Walter-CLI Commands (Ethical Hacking Track):\n
<span class="text-yellow-400">help</span> - Display this list.\n
<span class="text-yellow-400">status</span> - Check system and network health.\n
<span class="text-yellow-400">scan --target 10.0.0.1</span> - Simulate a quick port scan (replace IP).\n
<span class="text-yellow-400">decrypt access_key.bin</span> - Attempt to find the hidden key.\n
<span class="text-yellow-400">contact</span> - Open secure message module.\n
<span class="text-yellow-400">clear</span> - Clear terminal history.\n
<span class="text-yellow-400">exit</span> - Close the terminal window.`;
            break;
        case 'status':
            const now = new Date();
            response = `<span class="text-green-400">STATUS: 200 OK (Virtual Machine)</span>\n
Core Temp: 45°C | CPU Load: 12%\n
Kernel: USIU-CYBR-HACK-V.5.15\n
Geo-Location: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n
Network: WLAN0TTO_SECURED_MESH (AES-256)`;
            break;
        case 'contact':
            response = `Executing: secure-contact-module.sh. Fill the form below to send encrypted message.`;
            terminalContactForm.classList.remove('hidden');
            document.getElementById('terminal-name').focus();
            break;
        case 'ls':
        case 'dir':
            response = `Filesystem: /usr/local/walter\n
<span class="text-blue-400">bin/</span> <span class="text-blue-400">scripts/</span>\n
README.md\n
<span class="text-red-400">access_key.bin</span>\n
doomsday_cipher.py\n
nginx_logs.txt`;
            break;
        case 'clear':
            terminalOutput.innerHTML = '';
            return;
        case 'decrypt access_key.bin':
            response = `<span class="text-red-400">ERROR: access_key.bin is protected by Argon2. Key derivation failed.</span>\n
Hint: The password is not the name. Try a common Linux command plus a number.`;
            break;
        case 'ls -l | grep access':
        case 'cat /etc/passwd | grep root': // Hidden command
            response = `<span class="text-red-400">PERMISSION DENIED. System root access is blocked.</span>`;
            break;
        case 'ping 127.0.0.1 -c 4':
            response = `<span class="text-green-400">PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.\n
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.045 ms\n
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.039 ms\n
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.038 ms\n
64 bytes from 127.0.0.1: icmp_seq=4 ttl=64 time=0.041 ms\n
--- 127.0.0.1 ping statistics ---\n
4 packets transmitted, 4 received, 0% packet loss, time 3046ms</span>`;
            break;
        case 'exit':
            response = '<span class="text-yellow-400">Session terminated. Closing window...</span>';
            setTimeout(() => floatingWindow.classList.add('hidden'), 500);
            break;
        default:
            if (cmd.startsWith('scan --target')) {
                response = `<span class="text-yellow-400">SCAN IN PROGRESS...</span>\n
Starting NMAP-V virtual scan on ${cmd.split(' ')[2] || 'localhost'}...\n
PORT 22/tcp open ssh (OpenSSH 8.9)\n
PORT 80/tcp open http (NGINX 1.25.1)\n
PORT 443/tcp open https (Cloudflare proxy)\n
<span class="text-green-400">Scan completed: 3 ports open.</span>`;
            } else {
                response = `<span class="text-red-400">ERROR: Command not found: ${sanitizeInput(command)}. Type 'help' to see valid commands.</span>`;
            }
            break;
    }
    printToTerminal(response);
}

/**
 * Processes commands for Owuor (Python REPL) Mode.
 * @param {string} command - The user's input command.
 */
function processOwuorCommand(command) {
    const cmd = command.trim();
    let response = '';
    
    // Simple Python REPL simulation
    if (cmd === 'exit()' || cmd === 'quit()') {
        response = '<span class="text-yellow-400">Exiting Python REPL. Returning to CLI...</span>';
        setMode(WALTER_MODE);
        printToTerminal(response);
        return;
    } else if (cmd === 'help()') {
        response = `<span class="text-yellow-400">OWUOR REPL Help:</span>\n
This is a simulated Python 3.13.0 environment. Try basic math, print statements, or variable assignment.\n
<span class="text-fuchsia-400">e.g.,</span> x = 10\n
<span class="text-fuchsia-400">e.g.,</span> print('Hello, World!')\n
<span class="text-fuchsia-400">e.g.,</span> 2 + 2`;
    } else if (cmd.startsWith('print(')) {
        try {
            const content = cmd.match(/print\(['"](.*?)['"]\)/);
            if (content && content[1]) {
                response = sanitizeInput(content[1]);
            } else {
                 response = '<span class="text-red-400">SyntaxError: Invalid print statement.</span>';
            }
        } catch (e) {
            response = '<span class="text-red-400">SyntaxError: Check your quotation marks.</span>';
        }
    } else if (cmd.includes('=') && !cmd.includes('==') && !cmd.includes('!=')) {
        // Variable assignment simulation: x = 5
        const parts = cmd.split('=').map(p => p.trim());
        if (parts.length === 2) {
            variableStore[parts[0]] = parts[1];
            response = ''; // Assignment doesn't usually print anything
        }
    } else if (/^\d+([+\-*/%]\d+)+$/.test(cmd)) {
        // Simple math calculation: 5 + 3 * 2
        try {
            // WARNING: Use with caution in a real app (eval is dangerous). This is safe here since it's only math.
            response = eval(cmd);
        } catch (e) {
            response = `<span class="text-red-400">Calculation Error.</span>`;
        }
    } else if (variableStore[cmd]) {
        // Variable recall: x
        response = variableStore[cmd];
    } else if (cmd.startsWith('import')) {
        response = '<span class="text-yellow-400">Module Imported: security_essentials, crypt, os.</span>';
    } else {
        response = `<span class="text-red-400">NameError: name '${sanitizeInput(cmd)}' is not defined.</span>`;
    }

    if (response) {
        printToTerminal(response);
    }
}


// --- Window Management ---

/**
 * Utility function to print a line to the terminal output and scroll to the bottom.
 * @param {string} text - HTML content to print.
 */
function printToTerminal(text) {
    const p = document.createElement('p');
    p.innerHTML = text;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

/**
 * Minimizes the floating terminal window.
 */
function minimizeWindow() {
    floatingWindow.classList.add('hidden');
    minimizedBtnContainer.classList.remove('hidden');
    restoreBtn.focus();
}

/**
 * Restores the floating terminal window from minimized state.
 */
function restoreWindow() {
    floatingWindow.classList.remove('hidden');
    minimizedBtnContainer.classList.add('hidden');
    terminalInput.focus();
}

/**
 * Enables dragging functionality for the floating window.
 * @param {HTMLElement} element - The window element to be dragged.
 * @param {HTMLElement} header - The header element used as the drag handle.
 */
function makeDraggable(element, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
        e = e || window.event;
        e.preventDefault();
        
        // Get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        
        // Add active class for visual feedback
        header.style.cursor = 'grabbing';
    }

    const elementDrag = (e) => {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position:
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        // Keep element within viewport bounds
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - element.offsetHeight));
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - element.offsetWidth));

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    const closeDragElement = () => {
        // Stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        header.style.cursor = 'grab';
    }

    // Attach listeners
    if (header) {
        header.onmousedown = dragMouseDown;
        // Add touch support for mobile dragging
        header.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            document.ontouchend = closeDragElementTouch;
            document.ontouchmove = elementDragTouch;
            header.style.cursor = 'grabbing';
        }, false);
    }

    const elementDragTouch = (e) => {
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;

        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        newTop = Math.max(0, Math.min(newTop, window.innerHeight - element.offsetHeight));
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - element.offsetWidth));

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    const closeDragElementTouch = () => {
        document.ontouchend = null;
        document.ontouchmove = null;
        header.style.cursor = 'grab';
    }
}
