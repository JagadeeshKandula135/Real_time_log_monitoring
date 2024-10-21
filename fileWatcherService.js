const fs = require('fs');
const WebSocket = require('ws');

class FileWatcherService {
    constructor(wss) {
        this.FILE_NAME = 'test.log';
        this.wss = wss;
        this.bufferSize = 1024; 
        this.lastLinesCount = 10; 
        this.prevFileSize = 0; 
        this.cachedLastLines = []; 
        this.handleClientConnection();
        this.startWatching();
    }

    handleClientConnection() {
        this.wss.on('connection', (ws) => {
           
            if (this.cachedLastLines.length > 0) {
            
                ws.send(JSON.stringify({ content: this.cachedLastLines.join('\n') }));
            } else {
                this.sendLastLines(ws, true);
            }
        });
    }

    startWatching() {
        fs.watchFile(this.FILE_NAME, (curr, prev) => {
            if (curr.size > prev.size) {
                this.sendUpdates(prev.size, curr.size);
                console.log("File updated, sending updates");
            }
        });
    }

    sendLastLines(ws, updateCache = false) {
        fs.readFile(this.FILE_NAME, 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }

            const lines = data.trim().split('\n');
            const lastLines = lines.slice(-this.lastLinesCount); 

            if (updateCache) {
                
                this.cachedLastLines = lastLines;
            }

            
            ws.send(JSON.stringify({ content: lastLines.join('\n') }));
        });
    }

    sendUpdates(previousSize, currentSize) {
        const lengthToRead = currentSize - previousSize; 

        fs.open(this.FILE_NAME, 'r', (err, fd) => {
            if (err) {
                console.error('Error opening file:', err);
                return;
            }

            const buffer = Buffer.alloc(lengthToRead);
            
            fs.read(fd, buffer, 0, lengthToRead, previousSize, (err, bytesRead, buffer) => {
                if (err) {
                    console.error('Error reading file:', err);
                    return;
                }

                const data = buffer.toString('utf8', 0, bytesRead);
                const newLines = data.split('\n').filter(line => line.trim().length > 0);

            
                this.cachedLastLines = this.cachedLastLines.concat(newLines).slice(-this.lastLinesCount); // Keep only last 10 lines

            
                this.sendToClients(newLines.join('\n'));
                
                fs.close(fd, (err) => {
                    if (err) console.error('Error closing file:', err);
                });
            });
        });
    }

    sendToClients(content) {
        this.wss.clients.forEach(client => {
           
            if (client.readyState === WebSocket.OPEN) {
                const payload = JSON.stringify({ content });
                client.send(payload);
            }
        });
    }
}

module.exports = { FileWatcherService };
