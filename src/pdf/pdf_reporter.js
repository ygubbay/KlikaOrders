const fs = require('fs');
var pdfMakePrinter = require('pdfmake/src/printer');
var PDFImage = require("pdf-image").PDFImage;
const config = require('../config');

var pdf2png = require('pdf2png');
var err_hdl = require('../error/error_handler');
var orders = require('../orders');
var PdfPrinter = require('pdfmake/src/printer');


    


function convert_pdf_png(input_pdf, output_png) 
{
    //input_pdf = __dirname + "/cover.pdf";
    //output_png = __dirname + "/cover.png";

    console.log('print_test:', input_pdf, "=>", output_png);
    //print_test: C:\Development\Klika\KlikaServer\pdf/cover.pdf => C:\Development\Klika\KlikaServer\pdf/cover.png

    return new Promise((resolve, reject) => {
        pdf2png.convert(input_pdf, { quality: 30 }, (resp) => {

            if(!resp.success)
            {
                
                reject(new err_hdl.Klika_Error(err_hdl.ERR.COVER_CONVERT, resp.error));
                return;
            }
        
            console.log("Yayy the pdf got converted, now saving the file");
            
            fs.writeFile(output_png, resp.data, (err) => {
                if(err) {
                    reject(new err_hdl.Klika_Error(err_hdl.ERR_COVER_WRITE, "pdf2png error while writing file:", err));
                    return;
                }
                else {

                    resolve(output_png);
                }
            });
        });
    });
}


var fonts = {
        Arial: {
            normal: config.fonts_folder + 'arialuni.ttf',
            bold: config.fonts_folder + 'arialuni.ttf',
            italics: config.fonts_folder + '/arialuni.ttf',
            bolditalics: config.fonts_folder + '/arialuni.ttf'
        },
        Roboto: {
            normal: config.fonts_folder + '/Roboto-Medium.ttf',
            bold: config.fonts_folder + '/Roboto-Bold.ttf',
            italics: config.fonts_folder + '/Roboto-Bold.ttf',
            bolditalics: config.fonts_folder + '/Roboto-BoldItalic.ttf'
        },
        Hebrew: {
            normal: config.fonts_folder + '/Squarish Sans CT Regular.ttf',
            bold: config.fonts_folder + '/Squarish Sans CT Regular SC.ttf',
            italics: config.fonts_folder + '/Squarish Sans CT Regular.ttf',
            bolditalics: config.fonts_folder + '/Squarish Sans CT Regular.ttf'
        },
        Nachlaot: {
            normal: config.fonts_folder + '/Nachlaot.ttf',
            bold: config.fonts_folder + '/Nachlaot.ttf',
            italics: config.fonts_folder + '/Nachlaot.ttf',
            bolditalics: config.fonts_folder + '/Nachlaot.ttf'
        }
};



function daily_orders(orders_date) {

    console.log('daily_orders report started, Order Date:', orders_date);
    let all_content = [];
    let daily_cover_content = [];

    var printer = new PdfPrinter(fonts);
    
    return new Promise((resolve, reject) => {
 
        
        //console.log('daily_order_report part 5', orders.GetOrderCoverFile(order_rec));

        //const album_type_desc = order_rec.AlbumType? order_rec.AlbumType: 'Unrecognized Album Code [' + order_rec.AlumType + ']';
        //console.log('album_type_desc', album_type_desc);

        daily_cover_content = [{ columns: [{ text: 'Klika Daily Orders', width: '60%', fontSize: 24 }]},
                               { columns: [{ text: 'Date: ' + orders_date.toString().substr(0, 10), width: '60%', fontSize: 18 }]},
                               { columns: [{ text: ' ', width: '60%', fontSize: 18 }]}     ];

        orders.GetOrdersByDate(orders_date).then((order_recs) => {

            console.log('print db result');
            console.log(JSON.stringify(order_recs));
            if (!order_recs || !order_recs.length || order_recs.length == 0)
            {
                return new Promise((resolve, reject) => { 
                    
                    daily_cover_content = daily_cover_content.concat([{ columns: [ 
                        { text: 'No orders', width: '60%', fontSize: 14 }]}]);

                    console.log('daily_cover_content1:', daily_cover_content);
                    resolve( [] ) 
                });
            }
            
            console.log('order_recs:', order_recs);

            daily_cover_content = daily_cover_content.concat(
                    [{ columns: [ 
                        { text: 'Orders Total: ' + order_recs.length, width: '90%', fontSize: 14 }]},
                        { columns: [ 
                        { text: ' ', width: '90%', fontSize: 14 }]},
                        { columns: [ 
                        { text: '#', width: '8%', fontSize: 12, bold: true },
                        { text: 'Order Number', width: '20%', fontSize: 12, bold: true },
                        { text: 'Type', width: '25%', fontSize: 12, bold: true },
                        { text: 'Mail', width: '39%', fontSize: 12, bold: true },
                        { text: 'Qty', width: '8%', fontSize: 12, bold: true },
                        ]}
                        ]);



            order_recs.map((order_rec, index) => { 
                daily_cover_content = daily_cover_content.concat(
                    [{ columns: [ 
                        { text: (index + 1), width: '8%', fontSize: 12 },
                        { text: order_rec.OrderNumber, width: '20%', fontSize: 12 },
                        { text: order_rec.AlumType, width: '25%', fontSize: 12 },
                        { text: order_rec.Mail, width: '39%', fontSize: 12 },
                        { text: order_rec.Quantity, width: '8%', fontSize: 12 }],
                    
                }]
                )});

            const order_promises = order_recs.map((order_rec, index) => () => { return get_page_content(order_rec, index < order_promises.length - 1 ) } );

            daily_cover_content =  daily_cover_content.concat([{ columns: [ 
                        { text: ' ', width: '60%', fontSize: 14, pageBreak: 'after' }]}]);
            return promiseSerial(order_promises);

        }).then((order_pages_content) => { 
            
            console.log('daily_cover_content2:', daily_cover_content);
            console.log('order_pages_contnet2:', order_pages_content); 

            all_content = order_pages_content ? daily_cover_content.concat(order_pages_content): daily_cover_content;

            var docDefinition = {

                pageMargins: [ 40, 60, 40, 20 ],
                content: all_content
            };
        
            console.log('daily_order_report part 6', JSON.stringify(docDefinition));
            var pdfDoc = printer.createPdfKitDocument(docDefinition);

            console.log('daily_order_report part 6.1');

            var date_stamp = formatDT(new Date());
            const pdf_out_file = 'orders_daily_' + date_stamp + '.pdf'
            var pdf_out = config.pdf_files_folder + pdf_out_file; 
            console.log('output: ', pdf_out);
            pdfDoc.pipe(fs.createWriteStream(pdf_out));
            console.log('daily_order_report part 7');

            pdfDoc.end();

            console.log('daily_order_report: Pdf creation resolved');
            resolve({ is_error: false, file: pdf_out_file });
            return;

        }).catch((err) => { 
            
            console.error(err);
            reject(err);
            return;

        })
    });

    
}


const promiseSerial = funcs =>
  funcs.reduce((promise, this_func) =>
    promise.then(result => this_func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))


function single_order(order_number) {
    

    
    console.log('single_order report started, Order Number:', order_number);

    var printer = new PdfPrinter(fonts);
    
    return new Promise((resolve, reject) => {
          
        orders.GetOrder(order_rec).then((order_rows) => {

            if (order_rows && order_rows.length != 1)
            {
                reject(new err_hdl.Klika_Error(err_hdl.ERR.SINGLE_PDF_GET_ORDER, 'SingleOrder.GetOrder: Invalid # rows returned'));
                return;
            }

            order_rec = order_rows[0];
            console.log('single_order part 5', orders.GetOrderCoverFile(order_rec));

            return get_page_content(order_number);
            
        }).then((page_content) => {

            var docDefinition = {

                pageMargins: [ 40, 60, 40, 20 ],
                content: page_content
            };
                

            console.log('single_order part 6', JSON.stringify(docDefinition));
            var pdfDoc = printer.createPdfKitDocument(docDefinition);

            console.log('single_order part 6.1');

            var date_stamp = formatDT(new Date());
            var pdf_out_file = config.pdf_files_folder + 'order_' + order_rec.OrderNumber + '_' + date_stamp + '.pdf'; //'_' + (new Date()).toS('yyyyMMdd') + '_' + (new Date()).toString("hhmmss") + '.pdf';
            console.log('output: ', pdf_out_file);
            pdfDoc.pipe(fs.createWriteStream(pdf_out_file));
            console.log('single_order part 7');

            pdfDoc.end();

            console.log('SingleOrder: Pdf creation resolved');
            resolve('OK');

        });
        
    });
    
    
}



function get_page_content(order_rec, add_page_break) 
{


    return new Promise((resolve, reject) => {
        
        const left_margin = 30;
        const footer_top = 760;

        const album_type_desc = order_rec.AlbumType? order_rec.AlbumType: 'Unrecognized Album Code [' + order_rec.AlumType + ']';
        const last_line = add_page_break ? { columns: [   { text: 'FileName2: ', width: '25%'}, { text:  order_rec.FileName2, width: '75%' } ],
                                                pageBreak: 'after' }:
                                            { columns: [   { text: 'FileName2: ', width: '25%'}, { text:  order_rec.FileName2, width: '75%' } ]};

        console.log('album_type_desc', album_type_desc);
        const page_content =
                [{ columns: [ 
                    { text: 'Order: ' + order_rec.OrderNumber, width: '60%', fontSize: 24 }, 
                    { image:   orders.GetBarcodeFile(order_rec), width: 200, height: 50 },
                    ] },
                    


                    { columns: [ { text: '  ', width: '70%'}]},

                    {  image:   orders.GetOrderCoverFile(order_rec),
                        fit: [300, 200]},
                
                    { columns: [ { text: '  ', width: '70%'}]},
                    
                    { columns: [   { text: 'Order Date: ', width: '25%'}, { text: order_rec.OrderDate, width: '75%' } ] },
                    { columns: [   { text: 'Studio Mor Date: ', width: '25%'}, { text:  '  ', width: '75%' } ] },
                    { columns: [   { text: 'Album Code: ', width: '25%'}, { text:  order_rec.AlumType, width: '75%' } ] },
                    { columns: [   { text: 'Album Type: ', width: '25%'}, { text:  album_type_desc, width: '75%' } ] },
                    { columns: [   { text: 'Operator Id: ', width: '25%'}, { text:  order_rec.OperatorId, width: '75%' } ] },
                    { columns: [   { text: 'Campaign Name: ', width: '25%'}, { text:  order_rec.CampaignName, width: '75%' } ] },
                    { columns: [   { text: 'Quantity: ', width: '25%'}, { text:  order_rec.Quantity, width: '75%' } ] },
                    { columns: [   { text: 'Name: ', width: '25%'}, { text:  order_rec.Name.split(" ").reverse().join("  "), width: '75%', font: 'Hebrew' } ] },
                    { columns: [   { text: 'Address: ', width: '25%'}, { text:  order_rec.Address.split(" ").reverse().join("  "), width: '90%', font: 'Hebrew' } ] },
                    { columns: [   { text: 'PhoneNumber: ', width: '25%'}, { text:  order_rec.PhoneNumber, width: '75%' } ] },
                    { columns: [   { text: 'Mail: ', width: '25%'}, { text:  order_rec.Mail, width: '75%' } ] },
                    { columns: [   { text: 'Language: ', width: '25%'}, { text:  order_rec.Language, width: '75%' } ] },
                    { columns: [   { text: 'FileName1: ', width: '25%'}, { text:  order_rec.FileName1, width: '75%' } ] },

                    
                    last_line,
                    
                    
                                    
                // footer 
                { columns: [
                    { width: 250, 
                        text: 'Studio Mor', fontSize: 12 },
                    {
                        width: 300, 
                        text: '', fontSize: 8  }
                    ], absolutePosition: { x: left_margin, y: footer_top }
                },
                {
                    columns: [
                    { width: 250, 
                        text: 'Pier Kenig', fontSize: 8 },
                    {
                        width: 50, 
                        text: 'Tel: ', fontSize: 8 },
                    ], absolutePosition: { x: left_margin, y: footer_top + 15 }
                },
                {
                    columns: [
                    { width: 250, 
                        text: 'Jerusalem', fontSize: 8 },
                    {
                        width: 50, 
                        text: 'Fax: ', fontSize: 8  },
                    ], absolutePosition: { x: left_margin, y:  footer_top + 25 }
                },
                {
                    columns: [
                    { width: 250, 
                        text: 'Israel', fontSize: 8 },
                    {
                        width: 50, 
                        text: 'Email: ',
                        fontSize: 8 },
                    ], absolutePosition: { x: left_margin, y: footer_top + 35 }
                },
                {
                    columns: [
                    { width: 250, 
                        text: '', fontSize: 8 },
                    {
                        width: 50, 
                        text: 'Website: ',
                        fontSize: 8 },
                    ], absolutePosition: { x: left_margin, y: footer_top + 45 }
                }
            ];

        console.log('page content: ', JSON.stringify(page_content));
        resolve(page_content);
    });

}


function formatCurrency(amount) {
    return '₪' + amount.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "₪1,");
}


function leftpad (str, len, ch) {
  str = String(str);

  var i = -1;

  if (!ch && ch !== 0) ch = ' ';

  len = len - str.length;

  while (++i < len) {
    str = ch + str;
  }

  return str;
}


function formatDT(date) {
  var yyyy = date.getFullYear().toString();
  var mm = (date.getMonth()+1).toString();
  var dd  = date.getDate().toString();
  var hr = date.getHours().toString();
  var mins = date.getMinutes().toString();

  var mmChars = mm.split('');
  var ddChars = dd.split('');

  var hrChars = hr.split('');
  var minChars = mins.split('');

  return yyyy  + (mmChars[1]?mm:"0"+mmChars[0]) + (ddChars[1]?dd:"0"+ddChars[0]) + '_' + (hrChars[1]?hr:"0"+hrChars[0]) + (minChars[1]?mins:"0"+minChars[0]);
}


exports.SingleOrderPdf = single_order;
exports.DailyOrderPdf = daily_orders;
exports.ConvertPdfToPng = convert_pdf_png;