'use strict';
const url = process.env.ATLAS_URL;
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID

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
    })
    .then(client => {
      cachedDb = client.db();
      return cachedDb;
    })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      return { statusCode: 500, body: 'error' };
    });
}

function herosGetById (db, id) {
  console.log('=> query database');
  let o_id = new ObjectId(id)
  return db.collection('heros').find({'_id': o_id}).toArray()
    .then((heros) => { return {
        statusCode: 200,
        headers: {
              "Access-Control-Allow-Headers" : "Content-Type",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "OPTIONS,PUT,POST,DELETE,GET"
          },
        body: JSON.stringify(heros[0])
      }})
    .catch(err => {
      console.log('=> an error occurred: ', err);
      return { statusCode: 500, body: 'error' };
    });
}

function herosPutById (db, id, body) {
  console.log('=> query database');
  let o_id = new ObjectId(id)
  let o_body = JSON.parse(body)
  delete o_body._id
  return db.collection('heros').findOneAndReplace(
      {'_id': o_id},
      o_body,
      {
        returnOriginal: false
      }
    )
    .then((heros) => {
      return {
        statusCode: 200,
        headers: {
              "Content-Type" : "application/json",
              "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "OPTIONS,PUT,POST,DELETE,GET",
              'Access-Control-Allow-Credentials': true,
              "X-Requested-With" : "*"
          },
        body: JSON.stringify(heros.value) }
      })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      return { statusCode: 500, body: 'error' };
    });
}

module.exports.getById = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('=> event: ', event);
  connectToDatabase(url)
    .then(db => herosGetById(db, event.pathParameters.id))
    .then(result => {
      console.log('=> returning result: ', result);
      callback(null, result);
    })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      callback(err);
    });
};

module.exports.putById = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('=> event: ', event);
  connectToDatabase(url)
    .then(db => herosPutById(db, event.pathParameters.id, event.body))
    .then(result => {
      console.log('=> returning result: ', result);
      callback(null, result);
    })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      callback(err);
    });
};
