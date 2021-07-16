// pre-build report in mysql DB
const mysql = require("../../components/mysql");

const connection = mysql.pool;

const getReportDiff = (req, res) => {
    let queryReport = "SELECT * from evssip.gdc_report_diff LIMIT 100";
    connection.query(queryReport, (err, rows) => {
        if (err) throw err;
        // console.log('The data from report table are: \n', rows);
        res.json(rows);
        connection.end();
    });
};

module.exports = {
    getReportDiff
};
