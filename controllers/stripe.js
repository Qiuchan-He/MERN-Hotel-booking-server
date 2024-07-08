const User  = require("../models/user.js");
const Hotel = require("../models/hotel.js");
const Order = require("../models/order.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const queryString = require('querystring');

const  createConnectAccount = async (req, res)=>{
    // 1.find user from db
    const user = await User.findById(req.auth._id);
    //console.log(user);
    // 2.if user don't have stripe-account_id yet, create now
    if(!user.stripe_account_id){

        const account = await stripe.accounts.create({
            type:'express'
        });
        console.log('ACCOUNT ====>', account);
        user.stripe_account_id = account.id;
        user.save();
    }

    // 3.create login link based on account id (for frontend to complete onboarding)
    let accountLink = await stripe.accountLinks.create({
        account: user.stripe_account_id,
        refresh_url:process.env.STRIPE_REDIRECT_URL,
        return_url:process.env.STRIPE_REDIRECT_URL,
        type:"account_onboarding"
    });

    // 5.prefill any info such as email
    accountLink = Object.assign(accountLink,{
        "stripe_user[email]":user.email || undefined,   
    });
    console.log("Account_Link=====>",accountLink);
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
    // // 4. uodate payment schedule (optional, default is 2 days)

};

const getAccountStatus = async(req, res) =>{
    //console.log("GET ACCOUNT STATUS");
    const user = await User.findById(req.auth._id).exec();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    console.log("STRIPE_ACCOUNT", account);
    const updatedUser = await User.findByIdAndUpdate(user._id, 
        {
            stripe_seller: account,
        },
        {new : true},
    ).select("-password").exec();
    console.log("UPDATED USER",updatedUser);
    res.json(updatedUser);
};

const getAccountBalance = async(req, res) =>{
    const user = await User.findById(req.auth._id);
    try{
        const balance = await stripe.balance.retrieve({
            stripeAccount: user.stripe_account_id
        });

        console.log("BALANCE ===>", balance);
        res.json(balance);
        
    }catch(err) {
        console.log(err);
    }
};

const payoutSetting = async(req, res) => {
    try{
        const user = await User.findById(req.auth._id);
        const loginLink = await stripe.accounts.createLoginLink(user.stripe_account_id, 
            {
            redirect_url: process.env.STRIPE_SETTING_REDIRECT_URL,
            }
        );
        //console.log("LOGIN LINK FOR PAYOUT SETTING", loginLink);
        res.json(loginLink);

    }catch(err){
        console.log("STRIPE PAYOUT SETTING ERR", err);
    }
};

const stripeSessionId = async(req, res)=>{
    //console.log("your hit stripe session id", req.body.hotelId);
    //1. get hotel id from req.body
    const {hotelId} = req.body;
    //2. find the hotel based on the hotelId
    const item = await Hotel.findById(hotelId).populate('postedBy').exec();
    //3. 20% charge as application fee
    const fee = (item.price * 20)/100;
    //4. create a session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        //5. purchasing item details, it will be shown to user on checkout
        line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: item.title,
              },
              unit_amount: item.price*100,
            },
            quantity: 1,
          }],
        mode:'payment',
         //6. create payment intent with application fee and destination
        payment_intent_data: {
            application_fee_amount: fee * 100,
            transfer_data: {
                destination: item.postedBy.stripe_account_id,
            }
        },
        //success and cancel url
        success_url: `${process.env.STRIPE_SUCCESS_URL}/${item._id}`,
        cancel_url: process.env.STRIPE_CANCEL_URL,


    });
    
    //console.log("session ===>",session);
   
    //7. add this session object to user in the db
    await User.findByIdAndUpdate(req.auth._id, {stripeSession: session}).exec();

    //8. send session id as respinse to frontend
    res.send({
        sessionId: session.id,
    }); 

};

const stripeSuccess = async (req, res)=>{
   try{
     //1. get hotel id from req.body
     const {hotelId} = req.body;
     //2. find currently logged in user
     const user = await User.findById(req.auth._id).exec();
     //3. retrieve stripe session, based on session id
     const session_id = user.stripeSession.id;

     const session = await stripe.checkout.sessions.retrieve(session_id);
     //console.log(session);
     //4. if session payment status is paid, create order
     if(session.payment_status === "paid"){
         const orderExist = await Order.findOne({'session.id': session.id}).exec();
         if(orderExist){
             //if order exist, send success true
             res.json({success: true});
         }else{
             //else create order and send success true
             let newOrder = await new Order({
                 hotel: hotelId,
                 session,
                 orderedBy: user._id,
             }).save();
             //remove user's stripeSession
             await User.findByIdAndUpdate(user._id, {
                 $set: {stripeSession: {}}
             });
             //
             res.json({success: true});
         }
 
     }
   }catch(err){
    console.log("err in stripeSuccess", err );
   }


}



module.exports = {
    createConnectAccount,
    getAccountStatus,
    getAccountBalance,
    payoutSetting,
    stripeSessionId,
    stripeSuccess,
}