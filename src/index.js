const express = require('express');
const axios = require('axios');
const moment = require('moment-timezone');

const system = express();

const PORT = 8888;

const SpreadsheetURL = '';

let CachedItems = [];

function GetRemainingTime() {
    const CurrentTime = moment.tz("America/New_York");
    let NextRefresh = moment.tz("America/New_York").endOf('day').set({ hour: 19, minute: 0, second: 0});

    if (CurrentTime.isAfter(NextRefresh)) {
        NextRefresh.add(1, 'days');
    }

    const Duration = moment.duration(NextRefresh.diff(CurrentTime));
    const Hours = Duration.hours().toString().padStart(2, '0');
    const Minutes = Duration.minutes().toString().padStart(2, '0');
    const Seconds = Duration.seconds().toString().padStart(2, '0');

    return `${Hours}:${Minutes}:${Seconds}`;
}

system.get('/countdown', (req, res) => {
    const RemainingTime = GetRemainingTime();
    res.json({ time: RemainingTime });
});

system.use(express.static('src/public'));

system.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});