const express = require('express');
const axios = require('axios');
const moment = require('moment-timezone');

const system = express()

const PORT = 8888;

const SpreadsheetURL = '';

let CachedItems = [];

system.use(express.static('src/public'));

system.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});