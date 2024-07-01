[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

# Tarpaulin
Tarpaulin is a Canvas-like course management application implemented with a complete RESTful API for creating, deleting, editing courses and submissions users (students and instructors).

## Table of Contents
* [Features](#features)
* [Built With](#built-with)
* [Getting Started](#getting-started)
* [Running the Application](#running-the-application)
* [API Endpoints](#api-endpoints)
* [License](#license)

## Features
* User authentication and authorization (Admin, Instructor, Student roles)
* CRUD operations for courses, assignments, and submissions
* File upload and download for assignment submissions
* Course roster download in CSV format
* Pagination for requesting large data
* Rate limiting to prevent DDOS attacks
* Docker containerization for all services

## Built With
* [![Node.js][Node.js]][Node-url]
* [![Express.js][Express.js]][Express-url]
* [![MongoDb][MongoDB]][MongoDB-url]
* [![Redis][Redis]][Redis-url]
* [![RabbitMQ][RabbitMQ]][RabbitMQ-url]
* [![JWT][JWT]][JWT-url]
* [![Docker][Docker]][Docker-url]
* [![AWS ECS][AWS ECS]][AWS-url]

## Getting Started

### Prerequisites
* Node.js (>= 20.x)
* Docker
* AWS account

### Installation
1. Clone the repository
```sh
git clone https://github.com/kaungmyathtaywin/tarpaulin.git
cd tarpaulin
```

2. Install dependencies
```sh
npm install
```

3. Set up environment variables. Create a `.env` file in the root directory. Copy and paste the following into the created `.env` file.
```sh
PORT=8000
MONGO_DB=tarpaulin
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=hunter2
MONGO_USER=tarpaulin
MONGO_PASSWORD=hunter2 
```

## Running the Application
```sh
docker-compose up -d --build
```
It is recommended to run the application with docker-compose as it handles the containerization of each service used for the application and bundles them up together.

If you wish to run it without docker-compose, you have to manually containerize each service under the same docker network.
Services (Images) to containerize:
1. MongoDB
2. Redis
3. RabbitMQ

After setting up all those containers, you can run the API server with
```sh
npm start
```

The application should be running at your `localhost` with port `8000`.


## API Endpoints
All the endpoints for this application can be accessed through `openapi.yaml` file. You can copy and paste the contents from `openapi.yaml` into [swagger.io](https://editor.swagger.io/).

## License
Distributed under the MIT license. See LICENSE.txt for more information.


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/kaung-myat-htay-win-258ab9251/

[Node.js]: https://img.shields.io/badge/node.js-green?style=for-the-badge&logo=nodedotjs&logoColor=white&logoSize=auto
[Node-url]: https://nodejs.org/en

[Express.js]: https://img.shields.io/badge/express.js-000000?style=for-the-badge&logo=express&logoColor=white&logoSize=auto
[Express-url]: https://expressjs.com/

[MongoDB]: https://img.shields.io/badge/mongodb-4FAA41?style=for-the-badge&logo=mongodb&logoColor=white&logoSize=auto
[MongoDB-url]: https://www.mongodb.com/

[Redis]: https://img.shields.io/badge/redis-e30007?style=for-the-badge&logo=redis&logoColor=white&logoSize=auto
[Redis-url]: https://redis.io/

[RabbitMQ]: https://img.shields.io/badge/rabbitmq-ff6600?style=for-the-badge&logo=rabbitmq&logoColor=white&logoSize=auto
[RabbitMQ-url]: https://www.rabbitmq.com/

[JWT]:https://img.shields.io/badge/jwt-000000?style=for-the-badge&logoColor=white&logoSize=auto
[JWT-url]: https://jwt.io/

[Docker]: https://img.shields.io/badge/docker-blue?style=for-the-badge&logo=docker&logoColor=white&logoSize=auto
[Docker-url]: https://www.docker.com/

[AWS ECS]: https://img.shields.io/badge/aws_ecs-000000?style=for-the-badge&logo=awsfargate&logoColor=white&logoSize=auto
[AWS-url]: https://aws.amazon.com/ecs/