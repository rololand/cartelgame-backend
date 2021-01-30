'use strict';
const url = process.env.ATLAS_URL;
const MongoClient = require('mongodb').MongoClient;


let cachedDb = null;

function connectToDatabase (uri) {
  console.log('=> connect to database');
  if (cachedDb) {
    console.log('=> using cached database instance');
    return Promise.resolve(cachedDb);
  }
  return MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then(client => {
      cachedDb = client.db();
      return cachedDb;
    });
}

function tasksGetAll (db) {
  console.log('=> query database');
  return db.collection('tasks').find().toArray()
    .then((tasks) => { return {
        statusCode: 200,
        headers: {
              "Access-Control-Allow-Headers" : "Content-Type",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
          },
        body: JSON.stringify(tasks[0]) } })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      return { statusCode: 500, body: 'error' };
    });
}

module.exports.getTasks = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('event: ', event);
  connectToDatabase(url)
    .then(db => tasksGetAll(db))
    .then(result => {
      console.log('=> returning result: ', result);
      callback(null, result);
    })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      callback(err);
    });
};
