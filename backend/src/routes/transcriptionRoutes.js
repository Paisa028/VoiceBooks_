//Import Express to create the transcription routes
const express = require("express");

//Import Multer to handle uploaded audio recording
const multer = require("multer");

//Import the controller responsible for transcription requests
const {
    createTranscription,
} = require("../controllers/transcriptionController");

//Creates the transcription router
const router = express.Router();

/* Stores uploaded audio temporarily in moemory
The recording can be sent directly to the speech-t0-text service*/
const storage = multer.memoryStorage();

//Configures audio upload validation
const upload= multer({
    storage,


    //Limits upload audio recordings to 10 MB
    limits:{
        fileSize: 10*1024*1024,
    },
    
    //Accepts audio files onlu
    fileFilter:(req, file, callback) =>{

        if(file.mimetype && file.mimetype.startsWith("audio/")){
            callback(null, true);
        }
        else{
            callback(new Error("Only audio recording are allowed."))
        }
    },
});
//Receives one audio recording using the field name "audio"
router.post(
    "/",
    upload.single("audio"),
    createTranscription
);
//Exportd the router so that server.js can use it
module.exports = router;