var cron = require('node-cron');
 


function minute_task() 
{
    cron.schedule('* * * * *', function(){
    console.log('running a minutely task');
    });
}


function daily_task() 
{
    cron.schedule('* 8 * * 1,2,3,4,5', function(){
    console.log('running a daily task:', new Date());
    });

}

exports.MinuteTask = minute_task;
exports.DailyTask = daily_task;