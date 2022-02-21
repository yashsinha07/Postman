const newman = require('newman');
const fs = require('fs');
const Papa = require('papaparse');

newman.run({
    collection: require('./IAM v3 Migration.postman_collection.json'),
    reporters: 'cli',
    iterationData: './final-testing.csv'
}).on('beforeDone', (error, data) => {
    if (error) {
        throw error;
    }

    let statusCodes = [];
    let details = [];

    //Iterate Each Test Result
    const executionTestResults = data.summary.run.executions.reduce((accumulator, currentValue) => {

        //Logging the errors. 
        let statusCode = currentValue.response.code;
        statusCodes.push(statusCode);
        details.push(currentValue.response._details.detail);
        // if(statusCode !== 200) {
        //     console.log(currentValue.response._details);
        // }
        
        if(accumulator[currentValue.iteration] !== 'FAILED'){
            accumulator[currentValue.cursor.iteration] = currentValue.assertions.reduce((accumulator,currentValue) => {
                
                return accumulator && (currentValue.error === null || currentValue.error === undefined)
            
            }, true) ? 'PASSED' : 'FAILED';
        }
        return accumulator;
    }, []);

    //Calling Function to Run After Capturing the Neccessary Data
    updateCSVFile(executionTestResults, statusCodes, details);
});

function updateCSVFile(testResults, statusCodes, details) {

    //Read the Provided CSV File
    fs.readFile('./final-testing.csv', 'utf-8', (error, data) => {
        if (error) {
            throw error;
        }

        const jsonData = Papa.parse(data, { header: true });

        //Iterate Each Request
        jsonData.data.map((item, index) => item.testResult = testResults[index]);
        jsonData.data.map((item, index) => item.statusCodes = statusCodes[index]);
        jsonData.data.map((item, index) => item.details = details[index]);

        //Updating the JSON Data with Test Results
        const updatedCSV = Papa.unparse(jsonData.data);

        //Write to File
        fs.writeFile('./test-results/test-result.csv', updatedCSV, (error) => {
            if (error) {
                throw error;
            }
            console.log('Updated Successfully!!');
        })

    });
}