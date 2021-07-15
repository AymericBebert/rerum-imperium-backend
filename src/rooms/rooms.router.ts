import {Router} from 'express';
import {HotelProvider} from '../hotel-provider';
import {IRoom} from '../model/room';


interface WithError<T> {
    result: T | null;
    error: string;
}

const router = Router();

router.get<{ token: string }, WithError<IRoom>>('/room/:token', (request, response) => {
    const token = request.params.token;
    const room = HotelProvider.getInstance().getRoom(token);
    if (!room) {
        console.warn(`Error in GET /rooms/room/${token}`, 'Not found');
        response.status(404).send({result: null, error: 'Not found'});
        return;
    }
    response.send({result: room, error: ''});
});

export default router;
