
'use strict';

const config = require('../config');
const nodemailer = require('nodemailer');


    function send_mail (subject, body, to, files) 
    {
        console.log('send_mail: subject:', subject, 'to', to)
        // Create a SMTP transporter object
        let transporter = nodemailer.createTransport(
            {
                host: config.mail.smtp.host,
                port: config.mail.smtp.port,
                secure: config.mail.smtp.secure,
                auth: {
                    user: config.mail.username,
                    pass: config.mail.password
                },
                logger: false,
                debug: false // include SMTP traffic in the logs
            },
            {
                // default message fields

                // sender info
                from: 'Book4Me <no-reply@book4me.co.il>'
            }
        );



        let msg = {
            // Comma separated list of recipients
            to: to,

            // Subject of the message
            subject: subject,

            // HTML body
            html: body,

            // An array of attachments
            attachments: files ? files: []
        };

        transporter.sendMail(msg, (error, info) => {
            if (error) {
                console.log('send_mail: Error occurred: [', error.message, '], to: [' + to + '], subject [' + subject + ']');
                return process.exit(1);
            }

            console.log(new Date().toString(), 'Message', subject, ' sent');
            //console.log(nodemailer.getTestMessageUrl(info));

            // only needed when using pooled connections
            transporter.close();
        });
    }


function send_dev_email(subject, body) {

    const dev_support_list = config.mail.dev_support_list;
    for (var i=0; i<dev_support_list.length; i++)
    {
        const dev_support_email = dev_support_list[i];
        send_mail(subject, body, dev_support_email);
    }
}

function send_orders_email(subject, body) {
    const orders_list = config.mail.orders_list;
    for (var i=0; i<orders_list.length; i++)
    {
        const orders_email = orders_list[i];
        send_mail(subject, body, admin_email);
    }
}


exports.SendDevMail = send_dev_email;
exports.SendOrdersMail = send_orders_email;
exports.SendMail = send_mail;
