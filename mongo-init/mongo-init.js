/**
 * Script to create read/write access user for Tarpaulin DB 
 * and insert admin user for Tarpaulin app
 */

db.createUser({
    user: "tarpaulin",
    pwd: "hunter2",
    roles: [
      {
        role: "readWrite",
        db: "tarpaulin"
      }
    ]
  })

db = db.getSiblingDB('tarpaulin')

db.users.insertOne({
    name: 'admin',
    email: 'admin@gmail.com',
    password: '$2a$08$vYfSfCg26OFL5BoK684eo.hVu1JAtQ2JIDVbK7TYp7wbuNbmuc93m',
    role: 'admin'
})