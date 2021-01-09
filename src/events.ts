import {fromEvent, Observable} from 'rxjs';
import {FromEventTarget} from 'rxjs/internal/observable/fromEvent';
import {tap} from 'rxjs/operators';
import {IAnnounce, ICommand, ISatelles} from './model/satelles';
import {IImperiumAction, IJoinRoom} from './model/imperium';
import {IRoom} from './model/room';

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
    target: FromEventTarget<ReceivedEventTypes[T]>,
    eventName: T,
): Observable<ReceivedEventTypes[T]> {
    return fromEvent(target, eventName)
        .pipe(tap(data => process.env.DEBUG_SOCKET && console.log(`socket> ${eventName}: ${JSON.stringify(data)}`)));
}

export function emitEvent<T extends keyof EmittedEventTypes>(
    emitter: NodeJS.EventEmitter,
    eventName: T,
    ...data: Array<EmittedEventTypes[T]>
): void {
    if (process.env.DEBUG_SOCKET) {
        console.log(`socket< ${eventName}: ${JSON.stringify(data[0])?.substr(0, 999)}`);
    }
    emitter.emit(eventName, ...data);
}
