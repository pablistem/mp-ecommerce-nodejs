var express = require('express');
var exphbs  = require('express-handlebars');
var port = process.env.PORT || 3000
var bodyParser = require('body-parser');
var mercadopago = require('mercadopago');
var host = 'https://store-e-commerce.herokuapp.com/';
var url = host + 'callback?status=';

mercadopago.configure({
    access_token : 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id : 'dev_24c65fb163bf11ea96500242ac130004'
})

var app = express();

app.use(bodyParser.urlencoded({ extended:false }));
app.use(bodyParser.json());
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    res.render('detail', req.query);
});

app.get('/callback', function (req, res) {
    console.log(req.query)

    if(req.query.status.includes('success')) {
        return res.render('success', {
            payment_type : req.query.payment_type,
            external_reference : req.query.external_reference,
            collection_id : req.query.collection_id
        })
    }

    if(req.query.status.includes('pending')) {
        return res.render('pending')
    }

    if(req.query.status.includes('failure')) {
        return res.render('failure')
    }
    
    return res.status(404).end()
});

app.post('/notifications', function (req, res) {
    console.log('webhook', req.body)
    res.send(req.body)
});

app.post('/buy', function (req, res) {
    let preference = {
        back_urls : {
            success : url + 'success',
            pending : url + 'pending',
            failure : url + 'failure'
        },
        notification_url : host + 'notifications',
        auto_return : 'approved',
        payer : {
            name : 'Lalo',
            surname : 'Landa',
            email : 'test_user_63274575@testuser.com',
            phone : {
                area_code : '11',
                number : 22223333,
            },
            address : {
                zip_code : '1111',
                street_name : 'False',
                street_number : 123
            }

        },
        payment_methods : {
            excluded_payment_methods : [{
                id : 'amex',
            }],
            excluded_payment_types : [{
                id : 'atm',
            }],
            installments : 6
        },
        items : [
            {
                id : 1234,
                picture_url : 'https://store-e-commerce.herokuapp.com/assets/003.jpg',
                title : req.body.title,
                description: 'Dispositivo móvil de Tienda e-commerce',
                unit_price: Number(req.body.price),
                quantity: 1
            }
        ],
        external_reference : 'pablistem@gmail.com',
    }

    mercadopago.preferences.create(preference)
        .then(response => {
            global.init_point = response.body.init_point;
            res.render('confirm');
        }).catch(error => {
            console.log(error);
            res.send('error');
        })
});

app.listen(port);