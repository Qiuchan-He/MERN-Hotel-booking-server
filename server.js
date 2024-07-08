const express = require('express');
const fs = require('fs');
const app = express();
const morgan = require('morgan');
const mongoose =require('mongoose');
const cors = require('cors');
require('dotenv').config();

//db connection
mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));



app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
//route middleware
fs.readdirSync('./routes').map((r)=> app.use('/api',require(`./routes/${r}`)));



const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log(`Sever is running on port ${port}`));