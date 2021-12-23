import {Router} from 'express';
import {StatusCodes} from 'http-status-codes';
import {HotelProvider} from '../hotel-provider';
import {asyncHandler} from '../middlewares/async-handler';
import {IRoom} from '../model/room';
import {HttpError} from '../utils/http-error';

const router = Router();

router.get<{ token: string }, IRoom>(
    '/room/:token',
    asyncHandler((request, response, next) => {
        const token = request.params.token;
        const room = HotelProvider.getInstance().getRoom(token);
        if (!room) {
            return next(new HttpError(StatusCodes.NOT_FOUND, '', `No room ${token}`));
        }
        response.send(room);
    }),
);

export default router;
