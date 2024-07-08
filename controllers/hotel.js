const Hotel = require("../models/hotel.js");
const Order = require("../models/order.js");
const fs = require('fs');

const create =  async (req, res)=> {
    console.log('req.fields', req.fields);
    console.log("req.files", req.files);
    try{
        let fields = req.fields;
        let files = req.files;

        let hotel = new Hotel(fields);
        hotel.postedBy = req.auth._id;
        //handle image
        if(files.image){
            hotel.image.data = fs.readFileSync(files.image.path);
            hotel.image.contentType = files.image.type;
        }
        await hotel.save();
        res.status(200).json({
            message: 'Hotel created successfully',
            hotel,
        });
        
    }catch (err){
        res.status(400).json({
            err: err.message,
        })
    }
};


const getAllhotels = async(req, res)=> {
    try{
        let all = await Hotel.find({from :{$gte : new Date()}}).limit(24).select('-image.data').populate("postedBy",'_id name').exec();
        res.json(all);
    }catch(err){
        console.log(err);
    }
   
};

const getHotelImage = async(req, res)=>{
    let hotel = await Hotel.findById(req.params.hotelId).exec();
    if(hotel && hotel.image && hotel.image.data !== null) {
        res.set("Content-Type",hotel.image.contentType);
        res.send(hotel.image.data);
    }
};

const sellerHotels = async (req, res)=>{
    let all = await Hotel.find({postedBy: req.auth._id}).select('-image.data').populate('postedBy', '_id name').exec();
    res.send(all);
};

const remove  = async (req, res)=>{
    let removed = await Hotel.findByIdAndDelete(req.params.hotelId).select("-image.data").exec();
     res.json(removed);
};

const readHotel = async (req, res)=>{
    let hotel = await Hotel.findById(req.params.hotelId).populate("postedBy", "_id name").select('-image.data').exec();
    res.json(hotel);

};

const update = async (req, res)=>{
    try {
        let fields = req.fields;
        let files = req.files;

        let data = {...fields};

        if(files.image){
            let image = {};
            image.data = fs.readFileSync(files.image.path);
            image.contentType = files.image.type;
            data.image=image;
        }
        
        let update = await Hotel.findByIdAndUpdate(req.params.hotelId, data, {new: true}).select("-image.data");

        res.json(update);

    } catch(err){
        console.log(err);
        res.status(400).send('Hotel update failed. Try again.');
    }

};

const userHotelBookings = async (req, res)=>{
    const all = await Order.find({orderedBy: req.auth._id}).select('session').populate('hotel','-image.data').populate('orderedBy', '_id name').exec();
    res.json(all);
};

const isAlreadyBooked = async (req, res)=>{
    const {hotelId} = req.params;
    //find orders of the currently logged in user
    const userOrders = await Order.find({orderedBy: req.auth._id}).select('hotel').exec();
    //check if hotel id is found in userOrders array
    let ids = [];
    for (let i=0; i< userOrders.length; i++){
        ids.push(userOrders[i].hotel.toString());
    }
    res.json({
        ok: ids.includes(hotelId),
    })
};

const searchListings = async (req, res)=> {
    const {location, date, bed} = req.body;
    const  fromDate = date.split(',')[0];
    let result = await Hotel.find({from: {$gte: new Date(fromDate)}, location, bed }).select("-image.data").exec();
    //console.log(result);
    res.json(result);
}

module.exports = {
   create,
   getAllhotels,
   getHotelImage,
   sellerHotels,
   remove,
   readHotel,
   update,
   userHotelBookings,
   isAlreadyBooked,
   searchListings,
};