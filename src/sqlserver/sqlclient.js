var config = require('../config');
var err_hdl = require('../error/error_handler');


var Connection = require('tedious').Connection;  
    var db_config = {  
        userName: config.db.username,  
        password: config.db.password,  
        server: config.db.server,  
        // When you connect to Azure SQL Database, you need these next options.  
        options: {database: config.db.database}  
    };  
    
    
    var connection = new Connection(db_config);

    connection.on('connect', (err) => {

        if (!err) {
                    console.log("Connected to sql db");  
                    
                }
                else 
                {
                    console.log("Connection error: " + err);
                }
    });
    
    function connectToSql() {
        
        console.log('Connecting...');
        const p = new Promise(function(resolve, reject) {


            
            connection.on('connect', function(err) {  
                
                if (!err) {
                    console.log("Connected: ");  
                    resolve(connection);
                }
                else 
                {
                    console.log("Connection error: " + err);
                    reject(new err_hdl.Klika_Error(err_hdl.ERR_DB_ADD_IMPORTFILE, err));
                }
                
            });

            connection.on('infoMessage', infoError);
            connection.on('errorMessage', infoError);
            connection.on('debug', function(text) {
                console.log(text);
            })  

        });

        console.log('connectToSql promise returned');
        return p;

        
    }


    function infoError(err) {
        console.log(err);
    }

    var Request = require('tedious').Request;  
    var TYPES = require('tedious').TYPES;  




function getSqlData(query_name, sql, is_retry) {  

        console.log(query_name);
        console.log('------------');

        return new Promise((resolve, reject) => {


            //console.dir(connection);
            if (connection.state.name != 'LoggedIn')
            {
                let msg = 'Cannot execute request: ' + query_name +', sql connection not logged in.  Current state is: ' + connection.state.name;
                //console.dir(connection.state);
                console.log(msg);
                reject(new err_hdl.Klika_Error(err_hdl.ERR_DB_NO_CONNECTION, msg));
                return;
            }

            request = new Request(sql, function(err) {  
                if (err) {  
                    reject(new err_hdl.Klika_Error(err_hdl.ERR_DB_REQUEST, err));
                }
            });  
            var result = "";  
            
            var rows_obj = [];

            request.on('row', function(columns) {  

                var result_obj = {};    

                
                columns.forEach(function(column) {  
                

                    if (column.metadata.type.type == 'DATETIME') {
                        result_obj[column.metadata.colName] = new Date(column.value);
                    } 
                    else {
                        result_obj[column.metadata.colName] = column.value;
                    }
                    
                });  
                console.log('result_obj: ' + JSON.stringify(result_obj));
                rows_obj.push(result_obj);
            });  

            request.on('doneProc', function(rowCount, more) {  
                resolve(rows_obj);
                return;
            });  

            
            connection.execSql(request);
            
        }); 
    } 


    function addImportFile(import_filename) 
    {

        var sql = `    INSERT INTO [dbo].[OrderFiles]
                            ([filename])
                        VALUES
                            ('${import_filename}');
                        select @@identity as Id`;

        return getSqlData('addImportFile', sql);
    }


    function addOrder(order) {

        var sql = `INSERT INTO [dbo].[Orders]
                        ([OrderNumber]
                        ,[OperatorId]
                        ,[AlumType]
                        ,[CampaignName]
                        ,[Voucher]
                        ,[VoucherSam]
                        ,[Language]
                        ,[Quantity]
                        ,[Name]
                        ,[Address]
                        ,[PhoneNumber]
                        ,[FileName1]
                        ,[FileName2]
                        ,[ShippingType]
                        ,[ShippingAddress]
                        ,[Mail]
                        ,[OrderDate]
                        ,[Total]
                        ,[OrderStatusId]
                        ,TopFolder)
                    VALUES
                        ('${order.xml.ORDERNUMBER[0]}'
                        ,'${order.xml.OPERATORID}'
                        ,'${order.xml.ALUM_TYPE}'
                        ,'${order.xml.campaignName}'
                        ,'${order.xml.voucher}'
                        ,'${order.xml.voucher_sam}'
                        ,'${order.xml.language}'
                        ,${order.xml.quantity}
                        ,'${order.xml.Name}'
                        ,'${order.xml.Address}'
                        ,'${order.xml.PhoneNumber}'
                        ,'${order.xml.FileName1}'
                        ,'${order.xml.FileName2 ? order.xml.FileName2: ''}'
                        ,'${order.xml.ShippingType}'
                        ,'${order.xml.ShippingAddress}'
                        ,'${order.xml.mail}'
                        ,'${order.xml.date + ' ' + order.xml.time}'
                        ,'${order.xml.total}'
                        ,1
                        ,'${order.xml.TopFolder}');
                        select @@identity as Id`;
        console.log(sql);
        return getSqlData('addOrder', sql);                        
    }



    function getPagedOrders(page_index, page_size) 
    {

            var sql = `SELECT o.*, os.Name as OrderStatus
                    FROM orders o with (nolock) 
                    inner join orderstatuses os with (nolock) on o.orderstatusid = os.statusid  
                    ORDER BY orderid desc
                    OFFSET ${((page_index - 1) * page_size)} ROWS
                    FETCH NEXT ${page_size} ROWS ONLY;`;

        return getSqlData('getPagedOrders', sql);
    }


    function getCountOrders(order_number) 
    {
        var sql = `SELECT count(*) as num_orders
                    FROM [Orders] with (nolock)
                    WHERE OrderNumber = '${order_number}'`;

            return getSqlData('getCountOrders', sql);
    }

    function getAllOrders() 
    {
        var sql = `SELECT TOP 1000 [OrderId]
                        ,[OrderNumber]
                        ,[OperatorId]
                        ,[AlumType]
                        ,[CampaignName]
                        ,[Voucher]
                        ,[VoucherSam]
                        ,[Language]
                        ,[Quantity]
                        ,[Name]
                        ,[Address]
                        ,[PhoneNumber]
                        ,[FileName1]
                        ,[FileName2]
                        ,[ShippingType]
                        ,[ShippingAddress]
                        ,[Mail]
                        ,[OrderDate]
                        ,[Total]
                        ,[OrderStatusId]
                        ,[DateCreated]
                        ,TopFolder
                    FROM [Orders] with (nolock)`;

            return getSqlData('getAllOrders', sql);
    }


    function getOrder(order_number) 
    {
        var sql = `SELECT TOP 1 o.[OrderId]
                        ,o.[OrderNumber]
                        ,o.[OperatorId]
                        ,o.[AlumType]
                        ,o.[CampaignName]
                        ,o.[Voucher]
                        ,o.[VoucherSam]
                        ,o.[Language]
                        ,o.[Quantity]
                        ,o.[Name]
                        ,o.[Address]
                        ,o.[PhoneNumber]
                        ,o.[FileName1]
                        ,o.[FileName2]
                        ,o.[ShippingType]
                        ,o.[ShippingAddress]
                        ,o.[Mail]
                        ,o.[OrderDate]
                        ,o.[Total]
                        ,o.[OrderStatusId]
                        ,o.[DateCreated]
                        ,o.TopFolder
                        ,p.Name as AlbumType 
                    FROM [Orders] o with (nolock)
                    left outer join PrintCodes p with (nolock) on p.id = o.AlumType
                    where o.ordernumber = '${order_number}'
                    order by o.orderid desc`;
            console.log(sql);
            return getSqlData('getOrder', sql);
            
    }

function Formatyyyymmdd(adate) {
  var mm = adate.getMonth() + 1; // getMonth() is zero-based
  var dd = adate.getDate();

  return [adate.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

function getOrderStatuses() 
{
    var sql = `SELECT TOP 1000 [StatusId], [Name]
                FROM [OrderStatuses] with (nolock)`;
    console.log(sql);
    return getSqlData('getOrderStatuses', sql);
}


function getOrdersByDate(orders_date)
{
    const yyyyMMdd = Formatyyyymmdd(orders_date);

        var sql = `
                select * from 
		            (SELECT  TOP 1000 o.[OrderId]
                        ,o.[OrderNumber]
                        ,o.[OperatorId]
                        ,o.[AlumType]
                        ,o.[CampaignName]
                        ,o.[Voucher]
                        ,o.[VoucherSam]
                        ,o.[Language]
                        ,o.[Quantity]
                        ,o.[Name]
                        ,o.[Address]
                        ,o.[PhoneNumber]
                        ,o.[FileName1]
                        ,o.[FileName2]
                        ,o.[ShippingType]
                        ,o.[ShippingAddress]
                        ,o.[Mail]
                        ,o.[OrderDate]
                        ,o.[Total]
                        ,o.[OrderStatusId]
                        ,o.[DateCreated]
                        ,o.TopFolder
                        ,p.Name as AlbumType 
                    FROM [Orders] o with (nolock)
                    left outer join PrintCodes p with (nolock) on p.id = o.AlumType
                    where CONVERT(date, o.DateCreated) = '${yyyyMMdd}') as t1
		INNER JOIN (

			select Max(OrderId) as MaxID, count(*) as cnt
			from Orders with (nolock)
			where CONVERT(date, DateCreated) = '${yyyyMMdd}' 
			group by OrderNumber
		) dd on t1.OrderId = dd.MaxID
        order by t1.orderid desc`;

            console.log(sql);
            const res = getSqlData('getOrdersByDate', sql);
            
            return res;
}

    function updateOrderFile(orderfile_id, order_id) 
    {
        var sql = `update [OrderFiles] set orderid = ${order_id}, status=2 where orderfileid = ${orderfile_id}`
        console.log('updateOrderFile sql: ', sql);
        return getSqlData('updateOrderFile', sql);
    }


    function updateOrderFileStatus(orderfile_id, status_id) 
    {
        var sql = `update [OrderFiles] set status=${status_id} where orderfileid = ${orderfile_id}`
        console.log('updateOrderFileStatus sql: ', sql);
        return getSqlData('updateOrderFileStatus', sql);
    }

    function updateOrderStatus(order_id, status_id) 
    {
        var sql = `update [Orders] set OrderStatusId=${status_id} where orderid = ${order_id}`
        console.log('updateOrderStatus sql: ', sql);
        return getSqlData('updateOrderStatus', sql);
    }



   

exports.updateOrderFileStatus = updateOrderFileStatus;
exports.updateOrderStatus = updateOrderStatus;

exports.addImportFile = addImportFile;
exports.addOrder = addOrder;

exports.getAllOrders = getAllOrders;
exports.getOrder = getOrder;
exports.getOrdersByDate = getOrdersByDate;
exports.updateOrderFile = updateOrderFile;
exports.getPagedOrders = getPagedOrders;
exports.getOrderStatuses = getOrderStatuses;
exports.getCountOrders = getCountOrders;