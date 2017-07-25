var monthNames = ["1", "2", "3", "4", "5", "6",
    "7", "8", "9", "10", "11", "12"
];
var dayNames = ["星期日", "星期一", "星期二" ,"星期三 ", "星期四", "星期五", "星期六 "]

var newDate = new Date();
newDate.setDate(newDate.getDate());
$('#Date').html(newDate.getFullYear() +' 年 '  + monthNames[newDate.getMonth()] + ' 月 ' +  newDate.getDate() + ' 日 ' + dayNames[newDate.getDay()] );
