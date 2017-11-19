 var PromiseFtp = require('promise-ftp');
 var fs = require('fs');
 var config = require('./config');
 var err_hdl = require('./error/error_handler');  

  function check_ftp_folder() {
  
    var ftp = new PromiseFtp();
    ftp.connect({host: config.ftp.host, user: config.ftp.user, password: config.ftp.password, connTimeout: config.ftp.conn_timeout})
    .then(function (serverMessage) {

        return ftp.list(config.ftp.pdf_folder);
    }, (err) => {

        console.log('Error - Could not connect to Ftp:', err);
        return;
    }).then(function (list) {
        console.log('Directory listing:');

        var promises = list.map( (file, index) => {

            
            console.log('filename is', config.ftp.pdf_folder + '/' + file.name);
            
            ftp.get(config.ftp.pdf_folder + '/' + file.name).then((stream) => {
               return new Promise(function (resolve, reject) {
                    stream.once('close', resolve);
                    stream.once('error', reject);
                    stream.pipe(fs.createWriteStream(config.import_folder + file.name));
                });
            }, (err) => {
                console.log('Error doing a get on file', file.name);
                console.dir(err);
                return;
            })
        })
        
        return Promise.all(promises);

    }).then((result) => {

        console.log('files processed', result);
        return ftp.end();
    })
  }


  function check_new_zip_files() {
      
    return new Promise((resolve, reject)  => {
        var ftp = new PromiseFtp();
        ftp.connect({host: config.ftp.host, user: config.ftp.user, password: config.ftp.password,  connTimeout: config.ftp.conn_timeout})
        .then(function (serverMessage) {
            return ftp.list(config.ftp.pdf_folder);
        }, (err) => {
            let msg = 'Error - Could not connect to ftp - ' + err;
            console.log(msg);
            reject(new err_hdl.Klika_Error(err_hdl.ERR.FTP_CONNECTION, msg));
        }).then((list) => {
            ftp.end();
            resolve(list);
            
        }, (err) => {
            let msg = 'Error - Could not read ftp list - ' + err;
            console.log(msg);
            reject(new err_hdl.Klika_Error(err_hdl.ERR.FTP_READ_REMOTE_FOLDER, msg));
            
        })
    });
  }

    function get_zip_from_ftp() {

        
            
            return new Promise((resolve, reject) =>  {

                var file_list = [];
                var ftp = new PromiseFtp();
                ftp.connect({host: config.ftp.host, user: config.ftp.user, password: config.ftp.password, connTimeout: config.ftp.conn_timeout })
                .then(function (serverMessage) {
                    console.log('Server message: '+serverMessage);
                    return ftp.list(config.ftp.pdf_folder);
                }, (err) => {
                    let msg = 'Error - Could not connect to Ftp:' + err;
                    console.log(msg);
                    reject(msg);
                }).then( (list) => {

                    file_list = list;
                    console.log('list', list);
                    if (list && list.length > 0)
                    {
                        console.log('# remote files:', list.length);
                        console.log('filename is', config.ftp.pdf_folder + '/' + list[0].name);
                            
                        ftp.get(config.ftp.pdf_folder + '/' + list[0].name).then((stream) => {
                        
                            stream.once('close', () => { 
                                
                                ftp.delete(config.ftp.pdf_folder + '/' + file_list[0].name).then((result) => {
                                    
                                    console.log('got the file');
                                    resolve(file_list[0]) 
                                }, 
                                (err) => {
                                    let msg = 'Error deleting file ' + file_list[0].name + ' from remote folder';
                                    reject(err);
                                });
                            })
                                
                            stream.once('error', reject);
                            stream.pipe(fs.createWriteStream(config.import_folder + file_list[0].name));
                        
                        }, (err) => {
                    

                            let msg = 'Error doing a get on file' + file_list[0].name + ', ' + err;
                            console.log(msg);
                            
                            reject(msg)
                        })
                    }
                    else {

                        // no file found
                        console.log('no files found');
                        reject('no files found');
                        
                    }
                })
            })
    }


  function get_file(ftp, filename) {
    return ftp.get('G_1004746.zip');
  }
  function move_files(ftp, list, current_file_index)
  {
    if (!current_file_index)    
    {
        current_file_index = 0;
    }   

    if (current_file_index >= list.length)

        return;

    ftp.get(list[current_file_index]).then( (stream) => {

    });
        
  }
exports.CheckNewZipFiles = check_new_zip_files;
exports.CheckFtpFolder = check_ftp_folder;
exports.GetZipToOrdersFolder = get_zip_from_ftp;