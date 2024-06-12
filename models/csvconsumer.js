const amqp = require("amqplib")
const { queueName } = require('../lib/rabbitmq')
const { connectToDb } = require("../lib/mongo")
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost'
const rabbitmqUrl = `amqp://${rabbitmqHost}`
const { createObjectCsvStringifier } = require('csv-writer');
const path = require('path');
const fs = require('fs');

const csvDirectory = path.join(__dirname, '../media/rosters');

// Ensure the directory exists
if (!fs.existsSync(csvDirectory)) {
    fs.mkdirSync(csvDirectory);
}

let latestCsvFilePath = '';
exports.createCsvFile = async() => {
    try {
        await connectToDb()
        const connection = await amqp.connect(rabbitmqUrl)
        const channel = await connection.createChannel()
        await channel.assertQueue(queueName)
        // create the csv
        channel.consume(queueName, async msg => {
            if (msg){
                const data = JSON.parse(msg.content.toString())
                const students = data.students.map(student => ({
                    _id: student._id,
                    name: student.name,
                    email: student.email
                  }));
                const csvStringifier = createObjectCsvStringifier({
                header: [
                    { id: '_id', title: 'ID' },
                    { id: 'name', title: 'Name' },
                    { id: 'email', title: 'Email' }
                ]
                });
                const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(students);

                const fileName = `roster_${Date.now()}.csv`;
                const filePath = path.join(csvDirectory, fileName);
                
                // Save the CSV content to a file
                fs.writeFileSync(filePath, csvContent);
                channel.ack(msg)
                latestCsvFilePath = filePath
            }
        })

    } catch(e){
        console.error(e)
    }
}

exports.getLatestCsvFilePath = () => latestCsvFilePath;