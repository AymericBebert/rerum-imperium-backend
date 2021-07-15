import {fromEvent, Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {Socket} from 'socket.io';
import {IImperiumAction, IJoinRoom} from './model/imperium';
import {IRoom} from './model/room';
import {IAnnounce, ICommand, ISatelles} from './model/satelles';

export interface ReceivedEventTypes {
    'disconnect': void;
    'satelles join': IAnnounce;
    'satelles exit': void;
    'satelles update': ICommand[];
    'imperium join': IJoinRoom;
    'imperium exit': void;
    'imperium action': IImperiumAction;
}

export interface EmittedEventTypes {
    'room': IRoom;
    'satelles add': ISatelles;
    'satelles remove': string;
    'imperium action': IImperiumAction;
    'display error': string;
}

export function fromEventTyped<T extends keyof ReceivedEventTypes>(
    target: Socket<ReceivedEventTypes, any>,
    eventName: T,
): Observable<ReceivedEventTypes[T]> {
    return fromEvent<ReceivedEventTypes[T]>(target, eventName).pipe(
        tap(data => process.env.DEBUG_SOCKET && console.log(`socket> ${eventName}: ${JSON.stringify(data)}`)),
    );
}

export function emitEvent<T extends keyof EmittedEventTypes>(
    emitter: Socket<any, EmittedEventTypes>,
    eventName: T,
    ...data: EmittedEventTypes[T][]
): void {
    if (process.env.DEBUG_SOCKET) {
        console.log(`socket< ${eventName}: ${JSON.stringify(data[0])?.substr(0, 999)}`);
    }
    emitter.emit(eventName, ...(data as any));
}
