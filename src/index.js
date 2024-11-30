const express = require('express');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const system = express();

const PORT = 8888;

const CachedItemsFile = path.join(__dirname, 'CachedItems.json');

const SpreadsheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTM0QfM2QuDPNwfZYL51ct8_YG83I7xEqSOMutEWcIklFK80vix8MqXqHTFt3Z5HBUx8xKbsqgQNgXl/pub?gid=977965621&single=true&output=csv';

let CachedItems = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function LoadItems() {
    if (fs.existsSync(CachedItemsFile)) {
        const FileData = fs.readFileSync(CachedItemsFile, 'utf8');
        if (FileData) {
            CachedItems = JSON.parse(FileData);
            console.log('Items Loaded From CachedItems.json.');
            return true;
        }
    }
    console.log('No Cached Items Found Or CachedItems.json Is Empty.');
    return false;
}

function SaveItems(items) {
    fs.writeFileSync(CachedItemsFile, JSON.stringify(items, null, 2));
    console.log('Items Saved To CachedItems.json.')
}

async function FetchItems() {
    try {
        const response = await axios.get(SpreadsheetURL);
        const csvData = response.data;

        const rows = csvData.split('\n');
        const items = rows.slice(1).map(row => {
            const columns = row.split(',');
            return {
                image: columns[0].trim(),
                name: columns[1].trim(),
                price: columns[2].trim(),
                rarity: columns[3].trim(),
            };
        });

        const SelectedItems = [];
        for (let i = 0; i < 8; i++) {
            const RandomIndex = Math.floor(Math.random() * items.length);
            SelectedItems.push(items[RandomIndex]);
            items.splice(RandomIndex, 1);
        }

        return SelectedItems;
    } catch (error) {
        console.error('Error Fetching Data From The Spreadsheet:', error);
        return [];
    }
}

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

function IsAfter7PM() {
    const CurrentTime = moment.tz("America/New_York");
    const ScheduleTime = moment.tz("America/New_York").endOf('day').set({ hour: 19, minute: 0, second: 0 });
    return CurrentTime.isAfter(ScheduleTime);
}

function ScheduleNextRefresh() {
    const CurrentTime = moment.tz("America/New_York");
    const ScheduleTime = moment.tz("America/New_York").endOf('day').set({ hour: 19, minute: 0, second: 0 });

    if (CurrentTime.isAfter(ScheduleTime)) {
        ScheduleTime.add(1, 'day');
    }

    const CTBeforeST = ScheduleTime.diff(CurrentTime);

    console.log(`Next Refresh Scheduled In ${moment.duration(CTBeforeST).humanize()}`);
    setTimeout(async () => {
        CachedItems = await FetchItems();
        SaveItems(CachedItems);
        ScheduleNextRefresh();
    }, CTBeforeST);
}

async function InitializeItems() {
    LoadItems();
}

system.get('/item-shop', async (req, res) => {
    res.json(CachedItems);
});

system.get('/countdown', (req, res) => {
    const RemainingTime = GetRemainingTime();
    res.json({ time: RemainingTime });
});

InitializeItems();

system.use(express.static('src/public'));

system.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});