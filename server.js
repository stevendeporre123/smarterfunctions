const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const dayjs = require('dayjs');
const weekday = require('dayjs/plugin/weekday');
dayjs.extend(weekday);


const app = express();
const db = new sqlite3.Database('./database.db');

// Constants
const PORT = 3000;
//const GOOGLE_API_KEY = 'AIzaSyAnYIbYQ1LMlTt52950MdvW_cyFpNKuqcQ';
//const ORIGIN = 'stride europe, industriepark zwijnaarde';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ORIGIN = process.env.ORIGIN_ADDRESS;

if (!GOOGLE_API_KEY || !ORIGIN) {
    console.error('Missing required environment variables: GOOGLE_API_KEY or ORIGIN_ADDRESS');
    process.exit(1);
}
// Endpoint: /traveltime?destination=Some+Address
app.get('/traveltime', async (req, res) => {
    const destination = req.query.destination;
    if (!destination) return res.status(400).json({ error: 'Destination required' });

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: ORIGIN,
                destinations: destination,
                key: GOOGLE_API_KEY
            }
        });

        const seconds = response.data.rows[0].elements[0].duration.value;
        res.json({ travelTimeSeconds: seconds });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve travel time' });
    }
});

// Endpoint: /traveldistance?destination=Some+Address
app.get('/traveldistance', async (req, res) => {
    const destination = req.query.destination;
    if (!destination) return res.status(400).json({ error: 'Destination required' });

    // Compute next working day at 7AM
    let departure = dayjs().add(1, 'day').hour(7).minute(0).second(0);
    while (departure.day() === 0 || departure.day() === 6) {
        departure = departure.add(1, 'day');
    }

    const departureTime = Math.floor(departure.unix());

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: ORIGIN,
                destinations: destination,
                key: GOOGLE_API_KEY,
                departure_time: departureTime,
                mode: 'driving'
            }
        });

        const distance = response.data.rows[0].elements[0].distance.value;
        res.json({ travelDistanceMeters: distance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve travel distance' });
    }
});

// Endpoint: /traveltime?destination=Some+Address
app.get('/travel', async (req, res) => {
    const destination = req.query.destination;
    if (!destination) return res.status(400).json({ error: 'Destination required' });

    // Compute next working day at 7AM
    let departure = dayjs().add(1, 'day').hour(7).minute(0).second(0);
    while (departure.day() === 0 || departure.day() === 6) {
        departure = departure.add(1, 'day');
    }
    const departureTime = Math.floor(departure.unix());

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: ORIGIN,
                destinations: destination,
                key: GOOGLE_API_KEY,
                departure_time: departureTime,
                mode: 'driving'
            }
        });

        const element = response.data.rows[0].elements[0];
        const durationMinutes = element.duration.value / 60;
        const distanceKilometers = element.distance.value / 1000;

        res.json({
            travelTimeMinutes: Math.round(durationMinutes),
            travelDistanceKilometers: (distanceKilometers).toFixed(2),
            departureTime: departure.format()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve travel time' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
