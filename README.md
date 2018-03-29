# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview
This is my certification project for the Udacity Mobile Web Specialist Nanodegree program. The course focusing on mobile first responsive web design, offline first solutions using ServiceWorker and different caching methods, accessibility and performance. No third party JS or CSS libraries can be used.

## A little more about this project
This course and the project only covers the frontend part. Starting from a non-responsive, low-performing, online-only website which lacks accessibility, the target is a Progressive Web Application reaching at least 90 points on each Lighthouse tests. During the process I have also added some build automatization.

The project includes a backend in the data-server folder, which is out of scope of this course, but bundled it for convenience. The repository also includes the latest state of the dist folder, so the project reviewers don't need to install all the dev dependencies.

## Running the application
The latest stable version of the front-end application is available in the *dist/* folder for convenience or can be built from the repository root by running `npm install` and `gulp`. Note, that the image processing will require additional dependencies, like libjpeg and libpng.

The application requires a backend (by default, running on localhost:1337). The backend API is available in the *data-server/* folder and can be run by calling `npm start` after running `npm install`.

The lighthouse metrics for performance, best practices and PWA include some server side optimization, so the web server behind the application should: use gzip compression, HTTP/2, HTTPS, etc.
