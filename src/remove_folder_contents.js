"use strict";

var fs = require('fs');
var err_hdl = require('./error/error_handler');
var config = require('./config');
var fs_extra = require('fs-extra');




function deleteFile (file_path) 
{
  if( fs.existsSync(file_path) ) {
    
      fs.unlinkSync(file_path);
  }
}

var deleteFolderRecursive = function(path, child) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath, true);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });

    if (child)
      fs.rmdirSync(path);
  }
};


function move_folder_contents(folder1, folder2) 
{
    console.log('Move Folder contents: ', folder1, folder2);
    if (!fs.existsSync(folder1))
    {
      throw new err_hdl.Klika_Error(err_hdl.ERR.MOVE_SRC_NOTFOUND, 'MoveFolderContents: source folder not found:' + folder1);
      return;
    }
    if (!fs.existsSync(folder2))
    {
      throw new err_hdl.Klika_Error(err_hdl.ERR.MOVE_DEST_EXISTS, 'MoveFolderContents: destination folder not found:' + folder2);
      return;
    }


    fs.readdirSync(folder1).forEach(function(file,index){

        var curPath = folder1 + file;
        console.log('atttempt rename', curPath, folder2 + file);
        if (fs.lstatSync(curPath).isDirectory() && fs.existsSync(folder2 + file))
        {
          // skip if target folder already exists
          
        }
        else {

          if (!fs.lstatSync(curPath).isDirectory() && fs.existsSync(folder2 + file)) {
            try {
              fs.deleteFile(folder2 + file);
            }
            catch(del_err) {
              console.log("MoveFolder error: Could not remove existing target file: ", folder2 + file, "Skipping file");
            }
          }
        
          try {
            fs.renameSync(curPath, folder2 + file);
          }
          catch (re_err) {
            console.log("Error renaming file:", curPath, folder2 + file);
          }
        }
    });
}





function move_file_to_folder(file1, folder2) {

return new Promise((resolve, reject) => {

    if (!fs.existsSync(file1))
    {
      reject('source file not found:' + file1);
      return;
    }
    
    if (!fs.existsSync(folder2))
    {
      reject('destination folder does not exist:' + folder2);
      return;
    }

    fs.renameSync(file1, folder2);
    resolve('OK');
    
  });  
}


function copy_file(file1, file2) {

  // returns promise
  return fs_extra.copy(file1, file2);
}


function copy_folder(folder1, folder2)
{

  return new Promise((resolve, reject) => {
      
      fs_extra.copy(folder1, folder2, err => {

        if (err) {
          console.error(err)
          reject(err);
        }
        resolve('OK');
      });
  
  })
}


exports.DeleteFile = deleteFile;
exports.RemoveFolderContents = deleteFolderRecursive;
exports.MoveFolder = move_folder_contents;
exports.MoveFileToFolder = move_file_to_folder;
exports.CopyFile = copy_file;
exports.CopyFolder = copy_folder;  // promise

