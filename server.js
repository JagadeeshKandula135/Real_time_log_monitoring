const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const { FileWatcherService } = require('./fileWatcherService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const fileWatcherService = new FileWatcherService(wss);


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


// function writeToLogFile() {
//     let count = 0;
//     const interval = setInterval(() => {
//         const message = `Log entry ${count}\n`;
//         fs.appendFile('test.log', message, (err) => {
//             if (err) {
//                 console.error('Error writing to log file:', err);
//             }
//         });
//         count++;

        
//         if (count >= 100) {
//             clearInterval(interval);
//             console.log('Finished writing to log file.');
//         }
//     }, 1000); 
// }

// writeToLogFile();


server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
