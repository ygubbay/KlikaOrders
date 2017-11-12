
const err_hdl = require('./error/error_handler');
const bwipjs = require('bwip-js');
const fs = require('fs');

function CreateBarcodeFile(text, output_folder, barcode_file_prefix) 
{

    console.log('Create barcode: text', text, 'barcode_file_prefix', barcode_file_prefix);

    return new Promise((resolve, reject) => {

        bwipjs.toBuffer({
            bcid:        'code128',       // Barcode type
            text:        text,    // Text to encode
            scale:       3,               // 3x scaling factor
            height:      10,              // Bar height, in millimeters
            includetext: false,            // Show human-readable text
            textxalign:  'center',        // Always good to set this
        }, (err, png) => {
            if (err) {

                reject(new err_hdl.Klika_Error(err_hdl.ERR.BARCODE_GENERATE, `Creating BarCodeFile text [${text}]` ));
                return;
            }

            const barcode_file = output_folder + '\\' + barcode_file_prefix + '.png';
            fs.writeFile(barcode_file, png, (err) => {
                if (err) {
                    reject(new err_hdl.Klika_Error(err_hdl.ERR.BARCODE_WRITE_FILE, `Creating BarCodeFile text [${text}], file [${barcode_file}]` ));
                }

                resolve(barcode_file);
            });
            
        });
    });
}

exports.CreateBarcodeFile = CreateBarcodeFile;