var fs = require('fs');
var db = require('./sqlserver/sqlclient');
var err_hdl = require('./error/error_handler');


//
// Read order.xml contents and generate an Order record
//
function add_order(order_folder, orderfile_id) 
{

    let add_order_response = {};

    return new Promise((resolve, reject) => {

        // Get top directory       
        console.log('order_folder', order_folder); 
        var files = fs.readdirSync(order_folder);
        
        console.dir(files);
        if (files.length < 1)
        {
            reject (new err_hdl.Klika_Error(err_hdl.ERR_ADD_ORDER_EMPTY_ZIP, 'No files found in zip' ));
            return;
        }

        const top_folder_name = files[0];
        var top_folder = order_folder + '/' + files[0];
        console.log('top_folder', files[0]);

        if (!fs.statSync(top_folder).isDirectory())
        {
            reject (new err_hdl.Klika_Error(err_hdl.ERR.ADD_ORDER_TOPFOLDER, 'Single top folder not found' ));
            return;
        }

        // Get order.xml

        files = fs.readdirSync(top_folder);

        console.log('top folder file-list:');
        console.dir(files);

        var orders_file_found = false;
        for (var i=0; i<files.length; i++)
        {
            if (files[i].toLowerCase() == 'order.xml')
            {
                orders_file_found = true;
                break;
            }
        }

        if (!orders_file_found)
        {
            reject ( 'Order.xml file not found' );
            return;
        }
        var parseString = require('xml2js').parseString;

        var xml = fs.readFileSync(top_folder + '/order.xml').toString();
        parseString(xml, (err, order_rec) => {
            
            if (err) 
            {
                reject( 'Error while parsing Order.xml: ' + err );
                return;
            }

            // add TopFolder to object
            order_rec.xml.TopFolder = top_folder_name;
            console.dir(order_rec);

            add_order_response = order_rec.xml; // save this for the overall response

            db.getCountOrders(order_rec.xml.ORDERNUMBER).then((count_response) => {

                console.log('getCountOrders:', count_response);
                console.dir(count_response);
                const existing_order_count = count_response[0].num_orders;
                console.log('existing_order_count:', existing_order_count);
                if (existing_order_count > 0)
                {
                    throw ("Order Number already exists.");
                }
                else {
                    // Insert record into database
                    return db.addOrder(order_rec);
                }
            }).then((add_order_result) => {

                console.log('import.js: plain after addOrder');
                console.log(`addOrder.id: ${JSON.stringify(add_order_result)}, orderfile_id.Id: ${JSON.stringify(orderfile_id)}`);          
                
                // check addOrder result
                if (!add_order_result || add_order_result.length == 0) 
                {
                    throw('Insert into Orders table failed.  See log for more details.');
                }

                

                // Update the orderfile record with the orderid
                return db.updateOrderFile(orderfile_id[0].Id, add_order_result[0].Id);
                
            }).then((update_order_resp) => {

                resolve( add_order_response );
            }).catch((err) => {

                
                reject(err);
            });
        });    
    })
}


function add_import_file(filename)
{
    return db.addImportFile(filename);
}

exports.AddOrder = add_order;
exports.AddImportFile = add_import_file;