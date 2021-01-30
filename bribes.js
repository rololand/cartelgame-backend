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

function bribesGetAll (db) {
  console.log('=> query database');
  return db.collection('bribes').find().toArray()
    .then((bribes) => { return {
        statusCode: 200,
        headers: {
              "Access-Control-Allow-Headers" : "Content-Type",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
          },
        body: JSON.stringify(bribes[0]) } })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      return { statusCode: 500, body: 'error' };
    });
}

module.exports.getBribes = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('event: ', event);
  connectToDatabase(url)
    .then(db => bribesGetAll(db))
    .then(result => {
      console.log('=> returning result: ', result);
      callback(null, result);
    })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      callback(err);
    });
};
