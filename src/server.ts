import express from "express";
import { type Request, type Response } from 'express';
import { existsSync, PathLike } from 'fs';

import * as fs from 'fs';
const { exec } = require('child_process');

import createHttpError from 'http-errors';

const app = express();
const port = 8000;
const axios = require('axios')

const filePath : PathLike = 'cached-response.json';


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

            const urlToImage : string = response.dat.url;
            const curlCommand : string = `curl -o "file.jpg" ` + urlToImage;

            exec(curlCommand, (error : Error, stdout : string, stderr : Error) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    return res.status(500).send('Error executing curl');
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
                res.send(response.data);

            });

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
                const curlCommand : string = `curl -o "file.jpg" ` + urlToImage;

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
    res.send("bla")
});


router.get('/cosmos/photos/:requested_date', async(req : Request, res : Response) => {
    const requested_date : string | string[] = req.params.requested_date
    if (!isNaN(Date.parse(String(requested_date)))) {
        try {
            const response = await axios.get('https://api.nasa.gov/planetary/apod', {
                params: {
                    api_key: "jk4uiZkVB9zdL0f1fhrUAeaBwdK8Bl3hydnL8umn",
                    start_date: String(requested_date),
                    end_date: String(requested_date)
                }
            });
            res.send(response.data)
            const urlToImage : string = response.data[0].url;
            const curlCommand : string = `curl -o "file_specific_day.jpg" ` + urlToImage;

            exec(curlCommand, (error : Error, stdout : string, stderr : Error) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    return res.status(500).send('Error executing curl');
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }

            });

        } catch (error) {
            console.log(error);
            res.status(500).send('Error fetching data from NASA');
        }
    }

    else {
        throw createHttpError(400, 'Invalid date format, you need to use "YYYY-MM-DD"');
    }
    
});

app.use('/', router);

app.listen(port, () => {
  console.log(`Test backend is running on port ${port}`);
});
