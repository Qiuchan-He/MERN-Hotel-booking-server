const mongoose = require('mongoose');

const {Schema} = mongoose;
const {ObjectId} = Schema;

const orderSchema = new Schema({
  hotel: {
    type: ObjectId,
    ref: "Hotel",
    },
  session: {},
  orderedBy: {
    type: ObjectId,
    ref: "User",
    },
   },
   {timestamps: true}

);

module.exports = mongoose.model("Order", orderSchema);
