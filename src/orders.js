var fs = require('fs');
var config = require('./config');
var db = require('./sqlserver/sqlclient');
var err_hdl = require('./error/error_handler');



function GetOrder(order_number)
{
    return db.getOrder(order_number);
}


function GetOrdersByDate(orders_date)
{
    if (!(orders_date instanceof Date))
    {
        throw(`GetOrdersByDate: orders date is not a date value [${orders_date}]`);
    }
    
    return db.getOrdersByDate(orders_date);
}

function get_order_folder(order_date) {

//  /Orders/yyyy/MM
//  Create folder if does not exist

  const yyyy = order_date.getFullYear();
  const mm = order_date.getMonth() + 1;

  var cur_folder = config.orders_folder + yyyy;
  if (!fs.existsSync(cur_folder))
  {
    fs.mkdirSync(cur_folder);
  }

  cur_folder += '\\' + pad_zeros(mm, 2);
  console.log()
  if (!fs.existsSync(cur_folder))
  {
    fs.mkdirSync(cur_folder);
  }

  return cur_folder + '\\';
}


function pad_zeros(str, max)
{
    str = str.toString();
    return str.length < max ? pad_zeros("0" + str, max) : str;

}



function get_current_top_folder ()
{
    var top_files = fs.readdirSync(config.temp_folder_c);
    if (top_files.length == 1)
    {
        // this is supposed to be the top folder name
        return config.temp_folder_c + top_files[0];
    }
    console.log('WARNING: get_order_top_folder - Did not find exactly 1 file in current folder: ', config.temp_folder_c);
    return null;

}


function get_current_cover_file ()
{
    console.log('get_current_cover_file:', config.temp_folder_c);
    
    var top_folder = get_current_top_folder();
    if(fs.lstatSync(top_folder).isDirectory()) { 

        console.log('top folder found:', top_folder);
        var file_list = fs.readdirSync(top_folder);
        for (var i=0; i<file_list.length; i++)
        {
            console.log('check file', file_list[i]);
            if (file_list[i].toLowerCase().indexOf('_cover.') > -1)
            {
                console.log('return file:', file_list[i]);
                return file_list[i];
            }
        }
        return null; 
    } else { 
        return null;
    }        
        
    return null;
}


function get_current_pages_file ()
{
    console.log('get_current_pages_file:', config.temp_folder_c);


    // this is supposed to be the top folder name
    var top_folder = get_current_top_folder();
    if(fs.lstatSync(top_folder).isDirectory()) { 

        console.log('top folder found:', top_folder);
        var file_list = fs.readdirSync(top_folder);
        for (var i=0; i<file_list.length; i++)
        {
            console.log('check file', file_list[i]);
            if (file_list[i].toLowerCase().indexOf('_pages.') > -1)
            {
                console.log('return file:', file_list[i]);
                return file_list[i];
            }
        }
        return null; 
    } else { 
        return null;
    }        
        
    return null;
}


function get_current_magnet_file() 
{
    console.log('get_current_magnet_file:', config.temp_folder_c);

    // this is supposed to be the top folder name
    var top_folder = get_current_top_folder();
    if(fs.lstatSync(top_folder).isDirectory()) { 

        console.log('top folder found:', top_folder);
        var file_list = fs.readdirSync(top_folder);
        for (var i=0; i<file_list.length; i++)
        {
            console.log('check file', file_list[i]);
            if (file_list[i].toLowerCase() == '1.jpg')
            {
                console.log('return file:', file_list[i]);
                return file_list[i];
            }
        }
        return null; 
    } else { 
        return null;
    }        
        
    return null;

}


function get_current_canvas_file() 
{

    console.log('get_current_canvas_file:', config.temp_folder_c);

    // this is supposed to be the top folder name
    var top_folder = get_current_top_folder();
    if(fs.lstatSync(top_folder).isDirectory()) { 

        console.log('top folder found:', top_folder);

        
        var top_files = fs.readdirSync(config.temp_folder_c);
        var top_folder_name = '';
        if (top_files.length == 1)
        {
            top_folder_name = top_files[0];
        }
        else {
            return null;
        }
        var file_list = fs.readdirSync(top_folder);
        
        
        var top_files = fs.readdirSync(config.temp_folder_c);
        for (var i=0; i<file_list.length; i++)
        {
            console.log('check file', file_list[i]);
            if (file_list[i].toLowerCase() == (top_folder_name + '_cover.jpg').toLowerCase())
            {
                console.log('return file:', file_list[i]);
                return file_list[i];
            }
        }
        return null; 
    } else { 
        return null;
    }        
        
    return null;

}



function SetOrderStatusFailed(order_id, orderfile_id) 
{
    db.updateOrderFileStatus(orderfile_id, 4);
    db.updateOrderStatus(order_id, 3);
}


function SetOrderStatusComplete(order_id, orderfile_id)
{
    return db.updateOrderFileStatus(orderfile_id, 3).then((response) => 
    {
        return db.updateOrderStatus(order_id, 2);
    })
    
}


function GetOrderTopFolder(order_rec)
{
    const order_date_folder = get_order_folder(order_rec.DateCreated) 
    const order_top_folder = order_date_folder + order_rec.TopFolder + '\\';
    if (!fs.existsSync(order_top_folder))
    {
        fs.mkdirSync(order_top_folder);        
    }
    return order_top_folder;
}


function GetOrderMonthFolder(order_rec) 
{
    return get_order_folder(order_rec.DateCreated);
     
}


function GetOrderCoverFile(order_rec) 
{
    return get_order_folder(order_rec.DateCreated) + order_rec.TopFolder + '\\' + STUDIO_MOR_COVER_PNG;
}


function GetBarcodeFile(order_rec) 
{
    return get_order_folder(order_rec.DateCreated) + order_rec.TopFolder + '\\' + STUDIO_MOR_BARCODE_FILE;
}


function GetCurrentOrderType()
{
    console.log('get_current_order_type:', config.temp_folder_c);
    const top_folder = get_current_top_folder();
    if (top_folder == null)
    {
        console.log('top_folder not found');
        return null;
    }


    var top_files = fs.readdirSync(top_folder);
    if (top_files.length < 1)
    {
        console.log('no files found in top folder')
        return null;    
    }

    // check *cover.pdf file exists
    for (var i=0; i<top_files.length; i++)  {

        const current_filename = top_files[i];

        if (current_filename.toLowerCase().indexOf('cover.pdf') > 0)
        {
            return ORDER_TYPE.COVER_PDF;
        }
    }
    

    // check *pages.pdf file exists
    for (var i=0; i<top_files.length; i++)  {

        const current_filename = top_files[i];

        if (current_filename.toLowerCase().indexOf('pages.pdf') > 0)
        {
            return ORDER_TYPE.CALENDAR_PDF;
        }
    }
    

    // check 1.jpg exists (Magnet)
    for (var i=0; i<top_files.length; i++)  {

        const current_filename = top_files[i];
        if (current_filename.toLowerCase().indexOf('1.jpg') > -1)
        {
            return ORDER_TYPE.MAGNET;
        }
    }

    // check if TOP_FOLDERNAME_Cover.jpg exists
    for (var i=0; i<top_files.length; i++)  {

        const current_filename = top_files[i];
        console.log('compare:', current_filename.toLowerCase(), (top_folder + '_cover.jpg').toLowerCase());
        if ( (top_folder + '_cover.jpg').toLowerCase().indexOf(current_filename.toLowerCase()) > -1 )
        {
            return ORDER_TYPE.CANVAS;
        }
    }

    throw new err_hdl.Klika_Error(err_hdl.ERR.UNKNOWN_ORDER_FILES, 'Could not find order files in zip folder: ' + top_folder);
}


ORDER_TYPE = {
    COVER_PDF: 1,
    CALENDAR_PDF: 2,
    MAGNET: 3,
    CANVAS: 4
}

const STUDIO_MOR_COVER_PNG = 'studio_mor_cover.png';
const STUDIO_MOR_BARCODE_PREFIX = 'studio_mor_barcode'; 
const STUDIO_MOR_BARCODE_FILE  = STUDIO_MOR_BARCODE_PREFIX + '.png';

exports.STUDIO_MOR_COVER_PNG = STUDIO_MOR_COVER_PNG;
exports.STUDIO_MOR_BARCODE_PREFIX = STUDIO_MOR_BARCODE_PREFIX;
exports.STUDIO_MOR_BARCODE_FILE = STUDIO_MOR_BARCODE_FILE;
exports.ORDER_TYPE = ORDER_TYPE;
exports.GetOrder = GetOrder;
exports.GetOrdersByDate = GetOrdersByDate;
exports.SetOrderStatusFailed = SetOrderStatusFailed;
exports.SetOrderStatusComplete = SetOrderStatusComplete;
exports.GetCurrentTopFolder = get_current_top_folder;
exports.GetCurrentCoverFile = get_current_cover_file;
exports.GetCurrentPagesFile = get_current_pages_file;
exports.GetCurrentMagnetFile = get_current_magnet_file;
exports.GetCurrentCanvasFile = get_current_canvas_file;

exports.GetOrderTopFolder = GetOrderTopFolder;
exports.GetOrderCoverFile = GetOrderCoverFile;
exports.GetBarcodeFile = GetBarcodeFile;
exports.GetOrderMonthFolder = GetOrderMonthFolder;
exports.GetCurrentOrderType = GetCurrentOrderType;
