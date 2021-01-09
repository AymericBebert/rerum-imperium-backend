import socketIO from 'socket.io';
import {Subject} from 'rxjs';
import {emitEvent, EmittedEventTypes} from '../events';
import {ICommand, ISatelles} from '../model/satelles';
import {IImperiumAction} from '../model/imperium';

export class RerumRoom {
    public destroy$: Subject<void> = new Subject<void>();
    private _satellites: { [id: string]: { socket: socketIO.Socket, satelles: ISatelles } } = {};

    constructor(private readonly _io: socketIO.Server,
                private readonly _token: string,
                private readonly _roomName: string,
    ) {
    }

    public get token(): string {
        return this._token;
    }

    public get roomName(): string {
        return this._roomName;
    }

    public get satellites(): ISatelles[] {
        return Object.values(this._satellites).map(s => s.satelles);
    }

    public get socketRoom(): string {
        return this._token;
    }

    public addSatelles(socket: socketIO.Socket, satelles: ISatelles): boolean {
        const names = Object.values(this._satellites).map(s => s.satelles.name);
        if (!this._satellites[satelles.id]) {
            const satellesRootName = satelles.name;
            let i = 0;
            while (names.indexOf(satelles.name) !== -1) {
                i += 1;
                satelles.name = `${satellesRootName}_${i}`;
            }
        }
        this._satellites[satelles.id] = {socket, satelles};
        this.emit('satelles add', satelles);
        return true;
    }

    public removeSatelles(id: string): boolean {
        if (!this._satellites[id]) {
            return false;
        }
        this._satellites[id].socket.disconnect(true);
        delete this._satellites[id];
        this.emit('satelles remove', id);
        return true;
    }

    public updateSatelles(id: string, commands: ICommand[]): boolean {
        if (!this._satellites[id]) {
            return false;
        }
        this._satellites[id].satelles.commands = commands;
        this.emit('satelles add', this._satellites[id].satelles);
        return true;
    }

    public getSatellesCount(): number {
        return Object.keys(this._satellites).length;
    }

    public async addImperium(socket: socketIO.Socket): Promise<boolean> {
        try {
            await socket.join(this.socketRoom);
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }

    public async removeImperium(socket: socketIO.Socket): Promise<boolean> {
        try {
            await socket.leave(this.socketRoom);
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }

    public getImperiumCount(): Promise<number> {
        return this._io.sockets.adapter.sockets(new Set([this.socketRoom])).then(s => s.size);
    }

    public imperiumAction(action: IImperiumAction): boolean {
        const satelles = this._satellites[action.id];
        if (satelles) {
            emitEvent(satelles.socket, 'imperium action', action);
            return true;
        }
        return false;
    }

    public destroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public emit<T extends keyof EmittedEventTypes>(eventName: T, ...args: Array<EmittedEventTypes[T]>): void {
        if (process.env.DEBUG_SOCKET) {
            console.log(`socket< [${this.socketRoom}] ${eventName}: ${JSON.stringify(args[0])?.substr(0, 999)}`);
        } else {
            console.log(`Emitting event to clients of ${this.socketRoom}: ${eventName}`);
        }
        this._io.to(this.socketRoom).emit(eventName, ...args);
    }
}
