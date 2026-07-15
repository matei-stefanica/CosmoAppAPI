import { CONNREFUSED } from "dns";
import express from "express";
import { type Request, type Response } from 'express';
import { existsSync, PathLike } from 'fs';

import * as fs from 'fs';
const { exec } = require('child_process');

const app = express();
const port = 8000;
const axios = require('axios')

const filePath : PathLike = 'cached-response.json';

interface APIResponse {
  copyright: string;
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}


app.use(express.json());
const router = express.Router();
router.get('/cosmos', async(req : Request, res : Response) => {
    if (!existsSync(filePath)) {
        try {
            const response = await axios.get('https://api.nasa.gov/planetary/apod', {
                params: {
                    api_key: "jk4uiZkVB9zdL0f1fhrUAeaBwdK8Bl3hydnL8umn"
                }
            });
            const jsonString : string | ArrayBufferView<ArrayBufferLike> = JSON.stringify(response.data, null);

            fs.writeFile('cached-response.json', jsonString, (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                } else {
                    console.log('File written successfully');
                }
            });

            res.send(response.data);
        } catch (error) {
            res.status(500).send('Error fetching data from NASA');
        }
    }
    else {
        fs.readFile('cached-response.json', 'utf8', (err, data) => {
            if (err) {
                console.log('Error reading file:', err);
            } else {
                const cached_response = JSON.parse(data);
                const urlToImage : string = cached_response.url;
                console.log(urlToImage)

                const curlCommand : string = `curl -o "file.jpg" ` + urlToImage;
                console.log(curlCommand)

                exec(curlCommand, (error : Error, stdout : string, stderr : Error) => {
                    if (error) {
                        console.error(`Error: ${error.message}`);
                        return res.status(500).send('Error executing curl');
                    }
                    if (stderr) {
                        console.error(`stderr: ${stderr}`);
                    }
                    res.send(cached_response);
                });
            }
        });
        
    }
    
});

router.get('/test', async(req : Request, res : Response) => {
    try {
        const response = await axios.get('https://apod.nasa.gov/apod/image/2607/red_sprite_700.jpg', {
            responseType: "blob",
        });
        const imageUrl = URL.createObjectURL(response.data);
        const imgElement = document.createElement("img");
        imgElement.src = imageUrl;
        res.json({ dataFromSub: response.data, additionalInfo: 'Hello from my endpoint' });
    } catch (error) {
        res.status(500).send('Error fetching data from NASA');
    }
});

app.use('/', router);

app.listen(port, () => {
  console.log(`Test backend is running on port ${port}`);
});
