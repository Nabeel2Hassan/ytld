const express = require('express')
const fs = require('fs');
const ytdl = require('ytdl-core');
const { v4: uuidv4 } = require('uuid');
const { dirname } = require('path');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const path = require('path')
var cors = require('cors')
app.use('/static', express.static(path.join(__dirname, 'public')))

let requestVideos = [];
let requestedAudio = [];
app.get('/make-video', (req, res) => {
    try {
        console.log("Request revieved", req.query, req.params)
        var title;
        let thumbnailUrl;
        let formattedDuration;
        let requestId = uuidv4();
        let videoName = __dirname + '/public/uploads/mp4/' + requestId.split("-")[0] + '_video.mp4';
        let audioName = __dirname + '/public/uploads/mp3/' + requestId.split("-")[0] + '_audio.mp3';
        const url = req.query.url;
        console.log(req.query.url);



        ytdl.getInfo(`${url}`, function (info, err) {

        }).then((resp, er) => {
            if (resp) {
                console.log(resp.videoDetails.title);
                title = resp.videoDetails.title;
                console.log("title", resp);
                thumbnailUrl = resp.videoDetails.thumbnail.thumbnails[0].url;
                const duration = resp.videoDetails.lengthSeconds;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                console.log(`Duration: ${formattedDuration}`);

                console.log("thubnail url", thumbnailUrl);


            } else {

                console.log("error", er);
            }

        })
        ytdl(url)
            .on('finish', function (resp) {
                console.log('Download finished...');
                // Lets update the object
                for (let i = 0; i < requestVideos.length; i++) {
                    let currentIterObj = requestVideos[i]
                    if (currentIterObj.requestId == requestId) {
                        requestVideos[i].data = {
                            ...requestVideos[i].data,
                            mp4: videoName,
                            mp3: audioName,
                            title: title,
                            thumbnail: thumbnailUrl,
                            duration: formattedDuration
                        }
                    }
                }
            })
            .pipe(fs.createWriteStream(videoName));
        //ydtl fetch url
        ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
            .on('finish', function () {
                console.log('Download finished ...');
                // Lets update the object
                for (let i = 0; i < requestedAudio.length; i++) {
                    let currentIterObj = requestVideos[i]
                    if (currentIterObj.requestId == requestId) {
                        requestVideos[i].data = {
                            ...requestVideos[i].data,
                            mp4: videoName,
                            mp3: audioName,
                            title: title,
                            thumbnail: thumbnailUrl
                        }
                    }
                }
            })

            .pipe(fs.createWriteStream(audioName));

        res.send({ request_id: requestId })
        // Lets create an object to push 
        let objToPush = {
            url,
            requestId,
            data: null
        }
        requestVideos.push(objToPush);
        console.log(requestVideos);
    }
    catch (error) {
        console.log("Error ", error)
    }

})
//  Api for mp3 //////////////////////////////////////////////////////////////////////////////////////
// app.get('/make-video-mp3', (req, res) => {
//     try {
//         console.log("Request revieved", req.query, req.params)

//         let requestId = uuidv4();
//         // let videoName = __dirname + '/public/uploads/' + requestId.split("-")[0] + '_video.mp4';
//         let audioName = __dirname + '/public/mp3/' + requestId.split("-")[0] + '_audio.mp3';
//         const url = req.query.url;
//         console.log(req.query.url)

//         ytdl.getInfo(`${url}`, function (info, err) {

//         }).then((resp, er) => {
//             if (resp) {
//                 console.log(resp.videoDetails.title);
//                 title = resp.videoDetails.title;
//                 console.log("title", title);

//             } else {

//                 console.log("error", er);
//             }

//         })


//         ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
//             .on('finish', function () {
//                 console.log('Download finished ...');
//                 // Lets update the object
//                 for (let i = 0; i < requestedAudio.length; i++) {
//                     let currentIterObj = requestedAudio[i]
//                     if (currentIterObj.requestId == requestId) {
//                         requestedAudio[i].data = {
//                             ...requestedAudio[i].data,
//                             mp3: audioName,
//                             title: title
//                         }
//                     }
//                 }
//             })

//             .pipe(fs.createWriteStream(audioName));
//         res.send({ request_id: requestId })
//         // Lets create an object to push 
//         let objToPush = {
//             url,
//             requestId,
//             data: null
//         }
//         requestedAudio.push(objToPush);
//         //console.log(requestedAudio);

//     }
//     catch (error) {
//         console.log("Error ", error)

//     }

// })


app.get('/get-status', (req, res) => {
    const id = req.query.id;
    for (let i = 0; i < requestVideos.length; i++) {
        if (requestVideos[i].requestId == id) {
            return res.send(requestVideos[i])
        }
    }
    res.send({ error: "Not found" })
});
process.on('SIGINT', (code) => {
    console.log(`About to exit with code: ${code}`);
    process.exit();
});
app.listen(4001)