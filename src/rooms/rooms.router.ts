import {Router} from 'express';
import {HotelProvider} from '../hotel-provider';
import {IRoom} from '../model/room';

const router = Router();

router.get<{ token: string }, IRoom>('/room/:token', (request, response) => {
    const token = request.params.token;
    const room = HotelProvider.getInstance().getRoom(token);
    if (!room) {
        console.warn(`Error in GET /rooms/room/${token}`, 'Not found');
        response.status(404).send();
        return;
    }
    response.send(room);
});

export default router;
