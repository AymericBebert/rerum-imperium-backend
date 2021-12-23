import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {createServer, Server as HttpServer} from 'http';
import {StatusCodes} from 'http-status-codes';
import {Server, Socket} from 'socket.io';
import {config} from './config';
import {HotelProvider} from './hotel-provider';
import {RerumHotel} from './live/rerum-hotel';
import {finalErrorHandler} from './middlewares/final-error-handler';
import {loggerMiddleware} from './middlewares/logger';
import roomsRouter from './rooms/rooms.router';
import {onConnection} from './socket/on-connection';
import {HttpError} from './utils/http-error';

// Readiness items
const ready: Record<string, boolean> = {
    hotel: false,
};

// Creating web server
const app = express();

// Required middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(loggerMiddleware);

// HTTP probes (before logger middleware)
app.get('/healthCheck', (request, response) => {
    response.send({hostname: request.hostname, status: 'ok', version: config.version});
});

app.get('/ready', (request, response) => {
    response.status(Object.values(ready).every(r => r) ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).send(ready);
});

// HTTP CORS config
const corsAllowedOrigin = config.corsAllowedOrigin;
app.use(
    (req, res, next) => next(),
    corsAllowedOrigin
        ? cors({origin: corsAllowedOrigin.split(','), optionsSuccessStatus: 200})
        : cors(),
);

// routes
app.use('/rooms', roomsRouter);

// 404
app.use((req, res, next) => {
    if (!res.headersSent) {
        next(new HttpError(StatusCodes.NOT_FOUND, 'Not Found', `No response for: ${req.path}`));
    }
});

// Custom error handler
app.use(finalErrorHandler);

const http: HttpServer = createServer(app);

http.listen(
    config.port,
    () => console.log(`Rerum Imperium backend ${config.version} listening on port ${config.port}`),
);

// Socket.IO server with CORS config
const sioAllowedOrigin = config.sioAllowedOrigin;
const io = new Server(http, {cors: {origin: sioAllowedOrigin ? sioAllowedOrigin.split(',') : true}});

// Rerum Hotel
const hotel = new RerumHotel(io);
HotelProvider.registerHotel(hotel);

// Socket.IO new connection
io.on('connection', (socket: Socket) => onConnection(socket, hotel));

ready.hotel = true;
