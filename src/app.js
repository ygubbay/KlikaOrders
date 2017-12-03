"use strict";

var express = require('express');
var app = express();

var bodyParser  = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))    // parse application/x-www-form-urlencoded
app.use(bodyParser.json())    // parse application/json


app.use(function(req, res, next) {
    
    // CORS headers
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
    
    return next();
});


// api
var routes = require('./routes');
app.use('/', routes);

var config = require('./config');
var mailer = require('./mail/mailer');
var file_ops = require('./remove_folder_contents');
var orders = require('./orders');

// Pdf library
var pdf_report = require('./pdf/pdf_reporter');

//mailer.SendMail('KlikaOrders started', 'server was started at ' + new Date().toString('yyyyMMdd hhmm'), 'Yehuda gubbay <ygubbay@gmail.com>');


//return;
//pdf_report.DailyOrderPdf();
//return;


// Daily tasks
var cron = require('node-cron');

//var tasks = require('./daily_tasks');
//tasks.MinuteTask();
//tasks.DailyTask();

// Ftp
var ftp_comm = require('./ftpclient');
let { unzip } = require('cross-unzip')
var importer = require('./import');

// app server
var err_hdl = require('./error/error_handler');


	// Daily tasks
     cron.schedule('* 8 * * 1,2,3,4,5', () => {

	 	console.log('running a daily task:', new Date());
	 	// New to send 8:00 daily job
     });

	// Minutely task
	 cron.schedule('* * * * *', () => {

	 	console.log(new Date(), 'Polling ftp zip folder...');
	 	poll_zip_files();
     });

var orders = require('./orders');
var barcode = require('./barcode');

	// immediate poll
	console.log('initial poll:', new Date());
	poll_zip_files();


var executing_poll_zip_files = false;
function poll_zip_files() {

	// dont run 2 polls
	if (executing_poll_zip_files) 
	{
		console.log(new Date(), 'Polling ftp in progress - aborting scheduled start.');
		return;
	}
	executing_poll_zip_files = true;

	let file_found = '';
	ftp_comm.CheckNewZipFiles().then((next_file) => {

		// File found -> process it
		if (next_file && next_file.length > 0) {

			file_found = next_file;

			mailer.SendDevMail('Klika Order arrived', 'Ftp file found: ' + JSON.stringify(file_found));

			// Before we start with new file, remove ensure /Imports/Zip folder has no items
			//file_ops.RemoveFolderContents(config.import_folder);

			// Move zip file to Import folder
			ftp_comm.GetZipToOrdersFolder().then((zip_file) => {

				console.log('getziptoorders returned');
				if (zip_file) 
				{
					var filename = zip_file.name;
					console.log('transferred zip file:', zip_file);

					do_next_file(filename).then((response) => {

						executing_poll_zip_files = false;
						console.log('Processing completed on file: ', zip_file);
						return;
					}).catch((err) => {


						executing_poll_zip_files = false;
						console.log('Error processing file: ', zip_file);
						return;
					})
					
					// Remove current zip file from /Imports/Zip folder
					//file_ops.RemoveFolderContents(config.import_folder);
				}
				else {
					executing_poll_zip_files = false;
					console.log("Klika Server - CopyFile error" + "Filename ", zip_file )
					mailer.SendDevMail("Klika Server - CopyFile error", "Filename " + JSON.stringify(zip_file) );
					return;
				}
			}).catch ((err) => {

				executing_poll_zip_files = false;
				const err_msg = "Klika Server - CopyFile2 error" + "Filename " + err 
				console.log(err_msg);
				//Dont mail this.  This is OK.  It means the file is in use.  It happens when the file is still being copied
				// at the same time of the POLL copy
				//mailer.SendDevMail("Klika Server - CopyFile2 error", "Filename " + err );
				return;
			});
		}
		else {

			// no files found
			executing_poll_zip_files = false;
			return;
		}
			
	}).catch((err) => {

		let msg = `PollZipFiles error: <br />
					${file_found != ''? 'File: ' + file_found: ''}<br />
					${err.Type ? err.Type.Name: ''} - ${err.Message ? err.Message: ''}`;

		console.log(msg);
		mailer.SendDevMail('Klika Order error', msg);
		executing_poll_zip_files = false;
		return;

	});
}	


function do_next_file(file_found) {

	let do_response = { file: file_found };

	return new Promise((resolve, reject) => {

		// import first file in the list of files found
		console.log('About to do app.import_zip_file:', JSON.stringify(file_found));

		import_zip_file(file_found).then((response) => {

			console.log('back from import_zip_file');
			do_response = { order: response };
			console.dir(response);
			
			// move current order to orders folder
			//file_ops.RemoveFolderContents(orders.GetOrderTopFolder(response.order_rec));  // override order if exists

			console.log('move contents of folder,', config.temp_folder_c, 'to', orders.GetOrderMonthFolder(response.order_rec));
			file_ops.MoveFolder(config.temp_folder_c, orders.GetOrderMonthFolder(response.order_rec));
			console.log('move to orders folder completed');

			console.log('SetOrderStatusComplete: orderid', response.order_rec.OrderId, response.order_file_id[0])
			return orders.SetOrderStatusComplete(response.order_rec.OrderId, response.order_file_id[0].Id);
		}).then((order_complete_response) => {
			
			var success_msg = `File processed successfully: 
			<br/>${file_found}
			<br />response [${JSON.stringify(do_response)}]`;
			console.log(success_msg);

			mailer.SendDevMail('Klika Order imported', success_msg);

			//file_ops.RemoveFolderContents(config.import_folder);
			//file_ops.RemoveFolderContents(config.temp_folder);
			// write remote ack file


			resolve(do_response);
			return;
			
		}).catch((err) => {

			console.log(err);
			do_response.error = err;

			// Send mail notification
			err_hdl.LogMailError(`Import Zip File error: <br />Error [${JSON.stringify(do_response)}]`);	

			// Move current order to errors folder
			file_ops.MoveFolder(config.temp_folder_c, config.errors_folder);
			//orders.SetOrderStatusFailed(response.order_id, response.orderfile_id).then((order_fail_response) => {

			
			reject(do_response);
			return;

		});
	});
}


function import_zip_file(zip_file) {

	{
	console.log('import_zip_file zip_file=' + zip_file)
	let filename = '';
	let order_file_id = 2;
	let order_id = 1;
	let l_zipfile = zip_file;
	let add_order_rec = {};
	return new Promise((resolve, reject) => {
		
		importer.AddImportFile(l_zipfile).then((new_orderfile_id) => {

			console.log('after addimportfile: zip=', l_zipfile);
			order_file_id = new_orderfile_id;
			let orders_file = config.import_folder + l_zipfile;
			console.log('Import file record created [', l_zipfile, '], OrderFileId [', order_file_id,']');

			// unzip to temp folder
			file_ops.RemoveFolderContents(config.temp_folder);
 
			// create an order folder			
			console.log('unzip', orders_file, "to", config.temp_folder);

			//zipper.sync.unzip(orders_file).save(config.temp_folder);
			unzip(orders_file, config.temp_folder, err => {

				// done 
				console.log('unzip done');
				
				// import Order to database
				importer.AddOrder(config.temp_folder, order_file_id).then((order_rec) => {

					add_order_rec = order_rec;
					console.log(`zip added to db [${orders_file}]`)					

					const order_type = orders.GetCurrentOrderType();

					// generate cover png file: book4me_cover.png
					const studio_mor_cover_png = orders.GetCurrentTopFolder() + '\\' + orders.STUDIO_MOR_COVER_PNG;

					switch (order_type) {
						case orders.ORDER_TYPE.COVER_PDF:

							console.log('Order type: COVER_PDF');
							const cover_pdf = orders.GetCurrentCoverFile();
							console.log('cover_pdf', cover_pdf);
							if (cover_pdf)
							{

								console.log('Convert cover pdf to png file:', orders.GetCurrentTopFolder() + cover_pdf, ' => ', studio_mor_cover_png);
								return pdf_report.ConvertPdfToPng(orders.GetCurrentTopFolder() + '\\' + cover_pdf, studio_mor_cover_png);
							}
							else {
								
								throw "Error: Could not create orders.STUDIO_MOR_COVER_PNG from cover pdf";
							}
						break;
						case orders.ORDER_TYPE.CALENDAR_PDF:

							console.log('Order type: CALENDAR_PDF');
							const pages_pdf = orders.GetCurrentPagesFile();
							console.log('pages_pdf', pages_pdf);
							if (pages_pdf)
							{

								console.log('Convert pages pdf to png file:', orders.GetCurrentTopFolder() + '\\' + pages_pdf, ' => ', studio_mor_cover_png);
								return pdf_report.ConvertPdfToPng(orders.GetCurrentTopFolder() + '\\' + pages_pdf, studio_mor_cover_png);
							}
							else {
								
								throw "Error: Could not convert orders.STUDIO_MOR_COVER_PNG from pages_png";
							}
						break;
						
						case orders.ORDER_TYPE.MAGNET:

							// Check for Magnet files 1.jpg, 2.jpg, 3,jpg
							console.log('Order type: MAGNET');


							const magnet_file = orders.GetCurrentMagnetFile();
							console.log('Convert magnet file to png file:', orders.GetCurrentTopFolder() + '\\' + magnet_file, ' => ', studio_mor_cover_png);
							return file_ops.CopyFile(orders.GetCurrentTopFolder() + '\\' + magnet_file, studio_mor_cover_png)
							
						break;
						case orders.ORDER_TYPE.CANVAS:

							// Check for top_folder_Cover.jpg
							console.log('Order type: CANVAS');

							const canvas_file = orders.GetCurrentCanvasFile();
							console.log('Convert CANVAS png file:', orders.GetCurrentTopFolder() + '\\' + canvas_file, ' => ', studio_mor_cover_png);
							return file_ops.CopyFile(orders.GetCurrentTopFolder() + '\\' + canvas_file, studio_mor_cover_png)
							
						break;
						default:

							console.log('Error: Unknown order type');
							throw new err_hdl.Klika_Error(err_hdl.ERR.UNKNOWN_ORDER_FILES, 'Could not determine the Order type from the order files');
						break;
					}
				
				}).then((convert_cover_response) => {
					
					// Barcode
					console.log('Create barcode:');
					console.dir(add_order_rec);
					return barcode.CreateBarcodeFile(add_order_rec.ORDERNUMBER[0], orders.GetCurrentTopFolder(), orders.STUDIO_MOR_BARCODE_PREFIX);

				}).then((barcode_file) => {

					console.log('barcode done:', barcode_file);

					return orders.GetOrder(add_order_rec.ORDERNUMBER[0]);
				}).then((order_resp) => {

					console.log('GETorder response');
					console.dir(order_resp);
					resolve({ zip: l_zipfile, order_id: order_id, order_file_id: order_file_id, order_rec: order_resp[0]});

				}).catch( (err) => {

					reject(err);
					return;
				})
				

			})

		}).catch( (err) => {

			let msg = '';
			switch (err.Type) {

				case err_hdl.ERR.DB_ADD_IMPORTFILE:
					msg = `Error adding ImportFile record, [${err.Message}]`;
					break;
				case err_hdl.ERR_IMPORT_ZIP_FILE: 

					msg = `Error importing file ${zip_file.name} failed - ${err.Message} `;
					break;
				default:
					msg = `Unknown Error ${err.Type}: ${err.Message}`;
					break;
			}
			console.log(msg);
			reject(msg);
			return;
		});
	})
	}
}
