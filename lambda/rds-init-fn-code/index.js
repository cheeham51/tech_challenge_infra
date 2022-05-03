// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk')
const { Pool } = require('pg')

const secrets = new AWS.SecretsManager({})

exports.handler = async (e) => {
  try {
    const { config, event } = e.params
    const { password, username, host } = await getSecretValue(config.credsSecretName)

    // If the request type is UPDATE OR DELETE, return the function to avoid seeding data.
    if (event === 'UPDATE' || event === 'DELETE') {
      return {
        status: 'OK',
        results: `The request type is ${event}, so seeding data was not required.`
      }
    }

    const pool = new Pool({
      user: username,
      host,
      password,
      port: 5432,
    })

    await pool.query('DROP DATABASE IF EXISTS app;')

    await pool.query('CREATE DATABASE app;')

    const newPool = new Pool({
      user: username,
      host,
      password,
      port: 5432,
      database: 'app'
    })

    await newPool.query('DROP TABLE IF EXISTS tasks CASCADE')

    await newPool.query('CREATE TABLE tasks ( id SERIAL PRIMARY KEY, completed boolean NOT NULL, priority integer NOT NULL, title text NOT NULL)')

    await newPool.query("INSERT INTO tasks(completed, priority, title)VALUES(false, 0, '1st Task')")
    await newPool.query("INSERT INTO tasks(completed, priority, title)VALUES(false, 0, '2nd Task')")
    await newPool.query("INSERT INTO tasks(completed, priority, title)VALUES(false, 0, '3rd Task')")

    await pool.end()
    await newPool.end()

    return {
      status: 'OK',
      results: JSON.stringify(e)
    }
  } catch (err) {
    return {
      status: 'ERROR',
      err,
      message: err.message
    }
  }
}

function getSecretValue (secretId) {
  return new Promise((resolve, reject) => {
    secrets.getSecretValue({ SecretId: secretId }, (err, data) => {
      if (err) return reject(err)

      return resolve(JSON.parse(data.SecretString))
    })
  })
}