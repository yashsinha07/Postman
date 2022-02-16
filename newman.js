const newman = require('newman');
const fs = require('fs');
const Papa = require('papaparse');

newman.run({
    collection: require('./TutorialCollection.postman_collection.json'),
    reporters: 'cli',
    iterationData: './postman-tutorial.csv'
}).on('beforeDone', (error, data) => {
    if (error) {
        throw error;
    }

    //Find Faliures
    const findFailures = (accumulator,currentValue) => {
        return accumulator && (currentValue.error === null || currentValue.error === undefined)
    }

    //Iterate Each Test Result
    const executionTestResults = data.summary.run.executions.reduce((accumulator, currentValue) => {

        if(accumulator[currentValue.iteration] !== 'FAILED'){
            accumulator[currentValue.cursor.iteration] = currentValue.assertions.reduce(findFailures, true) ? 'PASSED' : 'FAILED';
        }
        return accumulator;
    }, []);

    //Calling Function to Run After Capturing the Neccessary Data
    updateCSVFile(executionTestResults);
});

function updateCSVFile(testResults) {

    //Read the Provided CSV File
    fs.readFile('./postman-tutorial.csv', 'utf-8', (error, data) => {
        if (error) {
            throw error;
        }

        const jsonData = Papa.parse(data, { header: true });
        //console.log(jsonData);

        //Iterate Each Request
        jsonData.data.map((item, index) => item.testResult = testResults[index]);

        //Updating the JSON Data with Test Results
        const updatedCSV = Papa.unparse(jsonData.data);
        console.log(updateCSVFile);

        //Write to File
        fs.writeFile('./test-results/test-result.csv', updatedCSV, (error) => {
            if (error) {
                throw error;
            }
            console.log('Updated Successfully!!');
        })

    });
}