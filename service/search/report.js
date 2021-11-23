// pre-build report in mysql DB
//const mysql = require("../../components/mysql");

const xmlBuilder = require('../xmlBuilder')

//const connection = mysql.pool;

const getReportDiff = (req, res) => {
//     let queryReport = "SELECT * from evssip.gdc_report_diff LIMIT 100";
//    let formatFlag = req.query.format||'';
//     if (formatFlag === 'xml' ) {
//         res.setHeader('Content-Type', 'application/xml');
//       }else{
//         res.setHeader('Content-Type', 'application/json');
//       }
//     connection.query(queryReport, (err, rows) => {
//         if (err) xmlBuilder.buildResponse(formatFlag, res, 500, { message: 'INTERNAL SERVER ERROR' });
//         xmlBuilder.buildResponse(formatFlag, res, 200, { Result: rows}, 'data');
//         //connection.end();
//     });
};

const getReportDiff1 = (req, res) => {
    // let queryReport = "SELECT * from evssip.gdc_report_diff LIMIT 100";
    // connection.query(queryReport, (err, rows) => {
    //     if (err) throw err;
    //     // console.log('The data from report table are: \n', rows);
    //     //res.json(rows);
    //     res.header('Content-Type','text/xml').send(xmlBuilder.buildObject(JSON.parse(JSON.stringify(rows))));
    //     connection.end();
    // });
};

module.exports = {
    getReportDiff
};
