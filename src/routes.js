var express = require('express');
var router = express.Router();
var db = require('./sqlserver/sqlclient');
var orders = require('./orders');
var pdf_report = require('./pdf/pdf_reporter');
var config = require('./config');
var mailer = require('./mail/mailer');

var api_prefix = '/api';
var fs = require('fs');


/*var err_hdl = require('./error_handler');
var users = require('./dal/users/users');
var projects = require("./dal/projects/projects");

var customers = require("./dal/customers/customers");
var todos = require("./dal/todos/todos");
var invoices = require("./dal/invoices/invoices");
var invoiceentries = require("./dal/invoices/invoiceentries");
var rates = require("./dal/projects/hourlyrates");

const PdfMaker = require('./pdf_maker');

var sql_client = require("./sql_server/sql_client");
*/


router.get(api_prefix + '/hello', hello);

router.get(api_prefix + '/orders/all', getAllOrders);
router.get(api_prefix + '/orders/:pageindex/:pagesize', getPagedOrders);

router.get(api_prefix + '/orders/get/:ordernumber', getOrder);
router.get(api_prefix + '/orders/pdf/daily/:yyyymmdd', getDailyPdf);
router.get(api_prefix + '/orders/pdf/daily/mail/:yyyymmdd', mailDailyPdf);

router.get(api_prefix + '/orders/pdf/:ordernumber', getSinglePdf);
router.get(api_prefix + '/orders/statuses', getOrderStatuses);      

function getOrderStatuses(req, res) 
{
    
    db.getOrderStatuses().then((response) => {

        res.json(response);
    });

}



function getOrder(req, res) {


}


function getDailyPdf(req, res) {

    const yyyymmdd = req.params['yyyymmdd'];

    yyyy = parseInt(yyyymmdd.substr(0, 4));
    mm = parseInt(yyyymmdd.substr(4, 2)) - 1;
    dd = parseInt(yyyymmdd.substr(6, 2));
    
    
    var dt = new Date(yyyy, mm, dd);

	pdf_report.DailyOrderPdf(dt).then((response) => {
        
            var filePath = config.pdf_files_folder + response.file;
            //var filePath = '../../store/pdffiles/orders_daily_20171109_1306.pdf';
            console.log('DailyOrderPdf done', filePath);
             var stat = fs.statSync('/development/klika/store/pdffiles/' + response.file);
        
            res.header('Content-disposition', 'inline; filename=' + response.file);
            res.header('Content-type', 'application/pdf');
            
              var readStream = fs.createReadStream(filePath);
              
            readStream.pipe(res);
            
            
        
    }, (err) => {
        console.error('DailyOrderPdf failed: ' + err);
        res.json( { is_error: true, error_message: err })
    })
    
}



function mailDailyPdf(req, res) {

    const yyyymmdd = req.params['yyyymmdd'];

    yyyy = parseInt(yyyymmdd.substr(0, 4));
    mm = parseInt(yyyymmdd.substr(4, 2)) - 1;
    dd = parseInt(yyyymmdd.substr(6, 2));
    
    
    var dt = new Date(yyyy, mm, dd);

	pdf_report.DailyOrderPdf(dt).then((response) => {
        
            var filePath = config.pdf_files_folder + response.file;
           
            setTimeout(() => { 
                mailer.SendMail('Klika Daily Orders', 'see attached pdf', '',  [{ filename: response.file, path: filePath}]) 
                res.json(response);    
        }, 5000);
            
            
            
        
    }, (err) => {
        console.error('DailyOrderPdf failed: ' + err);
        res.json( { is_error: true, error_message: err })
    })
    
}


function getSinglePdf(req, res) {


}

function getAllOrders(req, res) {

    
    db.getAllOrders().then((response) => {

        res.json(response);
    });
    
}


function getPagedOrders(req, res) {

    const pageindex = parseInt(req.params['pageindex']);
    const pagesize = parseInt(req.params['pagesize']);
    
    db.getPagedOrders(pageindex, pagesize).then((response) => {

        res.json(response);
    });
}


function importProjects(req, res) {
    sql_client.GetProjects().then((response) => {

        console.log('importing', response.length, " rows");
        
            
            projects.Project.save(response).then((save_response) => {
                
                
                console.log("Imported: ", response.length, " rows");
                res.json({ status: 'ok', rows: response.length});
                
            }).catch((err) => {
                console.log('SaveProject Err: ', err); res.json(err)
            });
        
        
    }).catch((err) => {
        res.json(err);
    })
}

function getTSEntries(req, res) {

    sql_client.GetTSEntries().then((response) => {
        res.json(response);
    }).catch((err) => {
        res.json(err);
    })
    
}
function importTSEntries(req, res) {
    sql_client.GetTSEntries().then((response) => {

        console.log('importing', response.length, " rows");
        
            
            tsentries.TSEntry.import(response).then((save_response) => {
                
                
                console.log("Imported: ", response.length, " rows");
                res.json({ status: 'ok', rows: response.length});
                
            }).catch((err) => {
                console.log('SaveTSEntryErr: ', err); res.json(err)
            });
        
        
    }).catch((err) => {
        res.json(err);
    })
}


function getInvoices(req, res) {

    return json.res({ msg: 'not yet implemented'});
    
}
function importInvoices(req, res) {
    sql_client.GetInvoices().then((response) => {

        console.log('importing ', response.length, " rows");
        
            
            invoices.Invoice.import(response).then((save_response) => {
                
                
                console.log("Imported: ", response.length, " rows");
                res.json({ status: 'ok', rows: response.length});
                
            }).catch((err) => {
                console.log('SaveInvoiceErr: ', err); res.json(err)
            });
        
        
    }).catch((err) => {
        res.json(err);
    })
}


function importHourlyRates(req, res) {
    sql_client.GetHourlyRates().then((response) => {

        console.log('importing ', response.length, " rows");
        
            
            rates.HourlyRate.import(response).then((save_response) => {
                
                
                console.log("Imported: ", response.length, " rows");
                res.json({ status: 'ok', rows: response.length});
                
            }).catch((err) => {
                console.log('Save HourlyRate Err: ', err); res.json(err)
            });
        
        
    }).catch((err) => {
        res.json(err);
    })
}

function importInvoiceEntries(req, res) {
    sql_client.GetInvoiceEntries().then((response) => {

        console.log('importing ', response.length, " rows");
        
            
            invoiceentries.InvoiceEntry.import(response).then((save_response) => {
                
                
                console.log("Imported: ", response.length, " rows");
                res.json({ status: 'ok', rows: response.length});
                
            }).catch((err) => {
                console.log('SaveInvoiceEntryErr: ', err); res.json(err)
            });
        
        
    }).catch((err) => {
        res.json(err);
    })
}


function getCustomers(req, res) {

    sql_client.GetCustomers().then((response) => {
        res.json(response);
    }).catch((err) => {
        res.json(err);
    })
    
}


function importCustomers(req, res) {
    sql_client.GetCustomers().then((response) => {

        console.log('importing', response.length, " rows");
        
            
            customers.Customer.save(response).then((save_response) => {
                
                
                console.log("Imported: ", response.length, " rows");
                res.json({ status: 'ok', rows: response.length});
                
            }).catch((err) => {
                console.log('SaveCustomerErr: ', err); res.json(err)
            });
        
        
    }).catch((err) => {
        res.json(err);
    })
}

function customersAll(req, res) {
    customers.Customer.getAllCustomers().then(function(response) {
        res.json(response);
    }).catch(function(err) {
        res.json(err);
    })
}

function checkLogin(req, res) {

    if (!err_hdl.checkRequiredParam(res, 'userAdd', 'Username', req.body.Username )) return;
    if (!err_hdl.checkRequiredParam(res, 'userAdd', 'Password', req.body.Password )) return;

    const params = { Username: req.body.Username, Password: req.body.Password };
    var response = users.User.checkLogin(params.Username, params.Password).then((response) => 
    {
        res.json(response);
    }).catch((err) => { res.json(err)});

    
}

function usersAll(req, res) {


    users.User.getAllUsers().then(function(response) {
        res.json(response);
    }).catch(function(err) {
        res.json(err);
    })
}


function userAdd(req, res) {

    if (!err_hdl.checkRequiredParam(res, 'userAdd', 'Username', req.body.Username )) return;
    if (!err_hdl.checkRequiredParam(res, 'userAdd', 'Password', req.body.Password )) return;

    
    res.end('user added successfully');
}

function todosByDay(req, res) {

    var yyyyMMdd = req.params['yyyyMMdd'];
    todos.Todo.getTodosByDay(yyyyMMdd).then((response) => {

        res.json(response);
    }).catch((err) => {
        res.json(err);
    })
} 

function todosDailyStats(req, res) {
     var yyyyMMdd = req.params['yyyyMMdd'];


    todos.Todo.getDailyStats(yyyyMMdd).then((response) => {

        res.json(response);
    }).catch((err) => {
        console.log(JSON.stringify(err), JSON.stringify(err));
        res.json(err);
    })
}

function todosProjectMonthly(req, res) {

    var yyyyMM = req.params['yyyyMM'];
    var projectid = parseInt(req.params['projectid']);


    todos.Todo.getProjectMonthly(projectid, yyyyMM).then((response) => {

        res.json(response);
    }).catch((err) => {
        console.log(JSON.stringify(err), JSON.stringify(err));
        res.json(err);
    })
}

function todosMonthly(req, res) {

    var yyyyMM = req.params['yyyyMM'];


    todos.Todo.getMonthly(yyyyMM).then((response) => {

        res.json(response);
    }).catch((err) => {
        console.log(JSON.stringify(err), JSON.stringify(err));
        res.json(err);
    })
}


function todosSave(req, res) {

    var todo = req.body;
    console.log('routes:todosSave: ', JSON.stringify(req.body))
    todos.Todo.save(todo).then((response) => {

        console.log('TodosSave:', response);
        res.json(response);
    }).catch((err) => {

        console.log('Todos Save:', err);

        if (!err.is_valid)
            res.status(400).json(err)
        else
            res.status(500).json(err);
    })
}


function invoiceTodos(req, res) {

    const invoiceid = parseInt(req.params['invoiceid']);

    invoiceentries.InvoiceEntry.getbyinvoiceid(invoiceid).then((response) => {

        res.json(response);
    }).catch((err) => {
        if (!err.is_valid)
            res.status(400).json(err)
        else
            res.status(500).json(err);
    })
}


function invoiceHeader(req, res) {
    const invoiceid = parseInt(req.params['invoiceid']);

    invoices.Invoice.getbyinvoiceid(invoiceid).then((response) => {

        res.json(response[0]);
    }).catch((err) => {
        if (!err.is_valid)
            res.status(400).json(err)
        else
            res.status(500).json(err);
    })
}

function invoicePrint(req, res) {

    const invoiceid = parseInt(req.params['invoiceid']);

    const print_i = Invoice.getInvoiceData(invoiceid);
    
    const print_inv = {
        from_company: {
            name: 'Nu Solutions',
            number: '319210738',
            is_company: false,
            phone_number: '093338888',
            fax_number: '093338888',
            email: 'ygubbay@gmail.com',
            website: 'www.nusolutions.com.au'
        },
        to: {
            name: 'Enerview',
            person_name: 'Alon Eisenberg'
        },
        logo_file: 'images/image.png',
        invoice_number: '10172',
        todos: [ { invoicedate: new Date(),
                    description: '123 PublicSite license agreement', 
                    duration: '02:14', 
                    amount: 405 },
                 { invoicedate: new Date(),
                    description: '123 PublicSite license agreement', 
                    duration: '02:14', 
                    amount: 405 },
                { invoicedate: new Date(),
                    description: '123 PublicSite license agreement', 
                    duration: '02:14', 
                    amount: 405 },
                { invoicedate: new Date(),
                    description: '123 PublicSite license agreement', 
                    duration: '02:14', 
                    amount: 405 }
                    ],
        total: {
            net: 1800,
            tax: 300,
            grand: 2100
        }

    }
    PdfMaker.print_invoice(print_inv);
}


function invoicesPaged(req, res) {

    const pageindex = parseInt(req.params['pageindex']);
    const pagesize = parseInt(req.params['pagesize']);
    
    invoices.Invoice.getpaged(pageindex, pagesize).then((response) => {

        res.json(response);
    }).catch((err) => {
        if (!err.is_valid)
            res.status(400).json(err)
        else
            res.status(500).json(err);
    })
    
}

function invoiceSave(req, res) {

    const invoice_save = req.body;
    console.log('routes:invoiceSave: ', JSON.stringify(req.body))
    invoices.Invoice.save(invoice_save).then((response) => {

        console.log('InvoiceSave:', response);
        res.json(response);
    }).catch((err) => {

        console.log('Invoice Save:', err);

        if (!err.is_valid)
            res.status(400).json(err)
        else
            res.status(500).json(err);
    })
}

function todosDelete(req, res) {

    var tsentryid = parseInt(req.params['tsentryid']);
    todos.Todo.delete(tsentryid).then((response) => {
        res.json(response);
    }).catch((err) => {
        res.status(500).json(err);
    })
}


function hello(req, res) {
    res.end('Yes.  we say hello sometimes.');
}


// currently unsecured
function projectAdd(req, res) {

    if (!err_hdl.checkRequiredParam(res, 'projectAdd', 'Name', req.body.Name )) return;

    var project_name = req.body.Name;
    projects.Project.add(project_name).then(function(response) {
        res.end('project added');
    }).catch(function(err) {
        res.json(err);
    })
}


function projectsAll(req, res) {

    var customerid = parseInt(req.params['customerid']);
    projects.Project.getAllProjects(customerid).then(function(response) {
        res.json(response);
    }).catch(function(err) {
        res.json(err);
    })
}

function projectsActive(req, res) {
    
    var customerid = parseInt(req.params['customerid']);
    console.log('projectsActive: customerid', customerid);
    projects.Project.getActiveProjects(customerid).then(function(response) {
        res.json(response);
    }).catch(function(err) {
        res.json(err);
    })
}


function getHourlyRatesForProject(req, res) {

    var projectid = parseInt(req.params['projectid']);
    
    rates.HourlyRate.getProjectRates(projectid).then((response) =>
    {
        res.json(response);
    }).catch((err) => {
        res.json(err);
    })
}
function getHourlyRateForUser(req, res) {

    var projectid = parseInt(req.params['projectid']);
    var userid = parseInt(req.params['userid']);

    rates.HourlyRate.getProjectUserRate(projectid, userid).then((response) =>
    {
        res.json(response);
    }).catch((err) => {
        res.json(err);
    })
}

function getProjectTodosInMonth(req, res) {
    
    var userid = parseInt(req.params['userid']);
    var yyyyMM = req.params['yyyyMM'];
    var yyyy = parseInt(yyyyMM.substr(0, 4));
    var month = parseInt(yyyyMM.substr(4, 2));

    projects.Project.getProjectTodosInMonth(userid, month, yyyy).then(function(response) {
        res.json(response);
    }).catch(function(err) {
        res.json(err);
    })
}

module.exports = router;