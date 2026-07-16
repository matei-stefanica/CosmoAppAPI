import express from "express";
import { type Request, type Response } from 'express';
import { existsSync, PathLike } from 'fs';

import * as fs from 'fs';
import dotenv from 'dotenv'

const app = express();
const port = 8000;
const axios = require('axios')

const FILEPATH : PathLike = 'cached-response.json';
const apiKey = process.env.API_KEY;

dotenv.config();

async function sendResponseForNewImageOfTheDay(req : Request, res : Response) : Promise<void> {
    try {
        const response = await axios.get('https://api.nasa.gov/planetary/apod', {
            params: {
                api_key: apiKey
            }
        });
        const stringRepresentationOfRespone : string = JSON.stringify(response.data, null);

        fs.writeFile(FILEPATH, stringRepresentationOfRespone, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('File written successfully');
            }
        });
        const urlToImage : string = response.data.url;
        downloadImage(req, res, urlToImage);
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching data from NASA');
    }
}

function sendResponseForCachedImageOfTheDay(req : Request, res : Response) : void {
    fs.readFile(FILEPATH, 'utf8', (err, data) => {
        if (err) {
            console.log('Error reading file:', err);
        } else {
            const cached_response = JSON.parse(data);
            const urlToImage : string = cached_response.url;
            downloadImage(req, res, urlToImage);
            res.send(cached_response);
        }
    });
}

async function decideresponseUsed(req : Request, res : Response) : Promise<void> {
    if (!existsSync(FILEPATH)) {
        sendResponseForNewImageOfTheDay(req, res);
    }
    else {
        sendResponseForCachedImageOfTheDay(req, res);
    }
}

async function downloadImage(req : Request, res : Response, urlToImage : string) {
    const imageResponse = await axios.get(urlToImage, { responseType: 'arraybuffer' });
    fs.writeFileSync(FILEPATH, Buffer.from(imageResponse.data, 'binary'));
}

app.use(express.json());
const router = express.Router();
router.get('/cosmos', async(req : Request, res : Response) => {
    decideresponseUsed(req, res);
});

app.use('/', router);

app.listen(port, () => {
  console.log(`Test backend is running on port ${port}`);
});
