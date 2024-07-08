const mongoose = require('mongoose');

const {Schema} = mongoose;
const {ObjectId} = Schema;

const hotelSchema = new Schema({
    title: {
        type: String,
        required: 'Title is required'
    },
    content: {
        type: String,
        required: 'Content is required',
        maxlength: 10000,
    },
    location: {
        type: String,
        required: 'Location is required',
    },
    price: {
        type: Number,
        required: "Price is required",
        trim: true,
    },
    postedBy: {
        type: ObjectId,
        ref: "User"
    },
    image: {
        data: Buffer,
        contentType: String,
    },
    from: {
        type: Date,
        required: 'From date is required',
    },
    to: {
        type: Date,
        required: 'To date is required',

    },
    bed: {
        type: Number,
        required: 'Number of beds is required',
    }
  },
  {timestamps: true}
);

module.exports = mongoose.model("Hotel", hotelSchema);