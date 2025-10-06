const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logFile = path.join(__dirname, '../console.log');
        this.init();
    }

    init() {
        // Create log file header
        const header = `=== NAKAWIN CASINO LOG ===\nStarted: ${new Date().toISOString()}\n\n`;
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, header);
        } else {
            this.log('=== APPLICATION RESTARTED ===');
        }
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type}] ${message}\n`;
        
        // Log to console
        console.log(logMessage.trim());
        
        // Log to file
        fs.appendFileSync(this.logFile, logMessage);
    }

    info(message) {
        this.log(message, 'INFO');
    }

    error(message) {
        this.log(message, 'ERROR');
    }

    warn(message) {
        this.log(message, 'WARN');
    }

    userAction(username, action, details = '') {
        const message = `USER: ${username} - ${action} ${details}`;
        this.log(message, 'USER_ACTION');
    }

    deposit(username, amount, details = '') {
        const message = `DEPOSIT: ${username} - ${amount} ₽ ${details}`;
        this.log(message, 'DEPOSIT');
    }

    withdrawal(username, item, details = '') {
        const message = `WITHDRAWAL: ${username} - ${item} ${details}`;
        this.log(message, 'WITHDRAWAL');
    }

    caseOpen(username, caseName, wonItem, details = '') {
        const message = `CASE_OPEN: ${username} - ${caseName} -> ${wonItem} ${details}`;
        this.log(message, 'CASE_OPEN');
    }

    wheelSpin(username, wonItem, details = '') {
        const message = `WHEEL_SPIN: ${username} -> ${wonItem} ${details}`;
        this.log(message, 'WHEEL_SPIN');
    }
}

module.exports = new Logger();