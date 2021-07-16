import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {createServer, Server as HttpServer} from 'http';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Server, Socket} from 'socket.io';
import {config} from './config';
import {fromEventTyped} from './events';
import {HotelProvider} from './hotel-provider';
import {RerumHotel} from './live/rerum-hotel';
import {loggerMiddleware} from './middlewares/logger';
import roomsRouter from './rooms/rooms.router';

// Creating web server
const app = express();
const http: HttpServer = createServer(app);

// HTTP middleware and CORS
app.use(loggerMiddleware);

const corsAllowedOrigin = config.corsAllowedOrigin;
app.use(
    (req, res, next) => next(),
    corsAllowedOrigin
        ? cors({origin: corsAllowedOrigin.split(','), optionsSuccessStatus: 200})
        : cors(),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Socket.IO server with CORS config
const sioAllowedOrigin = config.sioAllowedOrigin;
const io = new Server(
    http,
    sioAllowedOrigin
        ? {cors: {origin: sioAllowedOrigin.split(',')}}
        : {cors: {origin: true}},
);

// HTTP healthCheck route
app.get('/healthCheck', (request, response) => {
    response.send({hostname: request.hostname, status: 'ok', version: config.version});
});

// hotel
const hotel = new RerumHotel(io);
HotelProvider.registerHotel(hotel);

// routes
app.use('/rooms', roomsRouter);

// Socket.IO new connection
const onConnection = (socket: Socket): void => {
    console.log(`New connection from ${socket.id}`);
    const exited$ = new Subject<void>();

    fromEventTyped(socket, 'satelles join').subscribe(announce => {

        const room = hotel.addSatelles(socket, announce);
        if (!room) {
            return;
        }

        fromEventTyped(socket, 'satelles update')
            .pipe(takeUntil(exited$))
            .subscribe(commands => room.updateSatelles(announce.satelles.id, commands));

        fromEventTyped(socket, 'satelles exit')
            .pipe(takeUntil(exited$))
            .subscribe(() => {
                exited$.next();
                hotel.removeSatelles(socket, announce);
            });

        fromEventTyped(socket, 'disconnect')
            .pipe(takeUntil(exited$))
            .subscribe(() => {
                exited$.next();
                hotel.removeSatelles(socket, announce);
            });

        return;
    });

    fromEventTyped(socket, 'imperium join').subscribe(async join => {

        const room = await hotel.addImperium(socket, join);
        if (!room) {
            return;
        }

        fromEventTyped(socket, 'imperium action')
            .pipe(takeUntil(exited$))
            .subscribe(action => room.imperiumAction(action));

        fromEventTyped(socket, 'imperium exit')
            .pipe(takeUntil(exited$))
            .subscribe(() => {
                exited$.next();
                hotel.removeImperium(socket, join).catch(err => console.error(err));
            });

        fromEventTyped(socket, 'disconnect')
            .pipe(takeUntil(exited$))
            .subscribe(() => {
                exited$.next();
                hotel.removeImperium(socket, join).catch(err => console.error(err));
            });

        return;
    });
};

io.on('connection', (socket: Socket) => onConnection(socket));

http.listen(
    config.port,
    () => console.log(`Rerum Imperium backend ${config.version} listening on port ${config.port}`),
);
