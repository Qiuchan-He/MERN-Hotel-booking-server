const express = require('express');
const {create, remove, getAllhotels,getHotelImage,sellerHotels,readHotel, update, userHotelBookings, isAlreadyBooked, searchListings} = require('../controllers/hotel.js')
const formidable = require('express-formidable');
const  {requireSignin, hotelOwner} = require('../middlewares');

const router = express.Router();

router.get('/get-all-hotels', getAllhotels);
router.get('/hotel/image/:hotelId', getHotelImage);
router.get('/seller-hotels', requireSignin,sellerHotels);
router.post('/create-hotel',requireSignin, formidable(),create);
router.delete('/delete-hotel/:hotelId',requireSignin, hotelOwner,remove);
router.get("/hotel/:hotelId", readHotel)
router.put("/update-hotel/:hotelId", requireSignin, hotelOwner, formidable(), update)
router.get('/user-hotel-bookings', requireSignin, userHotelBookings);
router.get('/is-already-booked/:hotelId', requireSignin, isAlreadyBooked)
router.post('/search-listings',searchListings )

module.exports = router;