


var mailer = require('../mail/mailer');

function LogMailError(msg)
{
    console.log(msg);
    mailer.SendDevMail("Klika Server Error", msg);
}





class Klika_Error {

    constructor(type, message) {
        this.Type = type;
        this.Message = message;
    }
}


exports.Klika_Error = Klika_Error;
exports.LogMailError = LogMailError;

// Error types
const ERR = {

    DB_ADD_IMPORTFILE: { Id: 1, Name: "Add ImportFile record Error" },
    DB_NO_CONNECTION: { Id: 2, Name: "Sql Db Connection Failure" },
    DB_REQUEST: { Id: 3, Name: "Sql Db Connection Failure" },

    IMPORT_ZIP_FILE: { Id: 20, Name: "Import Zip File Error" },
    ADD_ORDER_EMPTY_ZIP: { Id: 21, Name: "Add Order Error: Zip file is empty" },
    ADD_ORDER_TOPFOLDER: { Id: 22, Name: "Add Order Error: Top Folder not found" },
    COVER_CONVERT: { Id: 23, Name: "Convert Cover Failure" },
    COVER_WRITE: { Id: 24, Name: "Convert Cover Write Error" },
    UNKNOWN_ORDER_FILES: { Id: 25, Name: "Unknown Order files in the Zip file"},

    MOVE_SRC_NOTFOUND: { Id: 40, Name: "MoveContents: Source not found" },
    MOVE_DEST_EXISTS: { Id: 41, Name: "MoveContents: Destination exists" },

    FTP_CONNECTION: { Id: 50, Name: "Ftp Connection Error" },
    FTP_READ_REMOTE_FOLDER: { Id: 51, Name: "Ftp Read Remote Folder Error" },
    FTP_COPY_FILE: { Id: 52, Name: "Retrieve remote Ftp failure" },

    BARCODE_GENERATE: { Id: 60, Name: "Error in generating barcode" },
    BARCODE_WRITE_FILE: { Id: 61, Name: "Error in writing barcode file" },

    SINGLE_PDF_GET_ORDER: { Id: 70, Name: "GetOrder for single order pdf" }
}
exports.ERR = ERR;
