const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("MondoDB Connected Successfully");
        app.listen(PORT, () => {console.log(`Sever Running on ${PORT}`)})
    })
    .catch(err =>{
        console.error("MongoDB Connection Failed :", err)
    });
