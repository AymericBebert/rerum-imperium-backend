import socketIO from 'socket.io';
import {RerumRoom} from './rerum-room';
import {IAnnounce} from '../model/satelles';
import {IJoinRoom} from '../model/imperium';
import {IRoom} from '../model/room';

export class RerumHotel {
    private rooms: { [token: string]: RerumRoom } = {};

    constructor(private readonly io: socketIO.Server) {
    }

    public getRoom(token: string): IRoom | null {
        const rerumRoom = this.rooms[token];
        if (!rerumRoom) {
            return null;
        }
        return {
            token: rerumRoom.token,
            roomName: rerumRoom.roomName,
            satellites: rerumRoom.satellites,
        };
    }

    public addSatelles(socket: socketIO.Socket, announce: IAnnounce): RerumRoom | null {
        const token = announce.token;
        if (!this.rooms[token]) {
            this.rooms[token] = new RerumRoom(this.io, token, announce.roomName);
        }
        const connected = this.rooms[token].addSatelles(socket, announce.satelles);
        if (connected) {
            this.rooms[token].emit('satelles add', announce.satelles);
        }
        const numSatelles = this.rooms[token].getSatellesCount();
        console.log(`Room ${this.rooms[token].socketRoom}: satelles joined (${numSatelles} connected) ${socket.id}`);
        return connected ? this.rooms[token] : null;
    }

    public removeSatelles(socket: socketIO.Socket, announce: IAnnounce): boolean {
        const token = announce.token;
        if (!this.rooms[token]) {
            return false;
        }
        const removed = this.rooms[token].removeSatelles(announce.satelles.id);
        const numSatelles = this.rooms[token].getSatellesCount();
        console.log(`Room ${this.rooms[token].socketRoom}: satelles exited (${numSatelles} connected) ${socket.id}`);
        this.cleanRoomIfEmpty(token).catch(err => console.log(err));
        return removed
    }

    public async addImperium(socket: socketIO.Socket, join: IJoinRoom): Promise<RerumRoom | null> {
        const token = join.token;
        if (!this.rooms[token]) {
            return null;
        }
        const connected = await this.rooms[token].addImperium(socket);
        const numImperium = await this.rooms[token].getImperiumCount();
        console.log(`Room ${this.rooms[token].socketRoom}: imperium joined (${numImperium} connected) ${socket.id}`);
        return connected ? this.rooms[token] : null;
    }

    public async removeImperium(socket: socketIO.Socket, join: IJoinRoom): Promise<boolean> {
        const token = join.token;
        const removed = await this.rooms[token].removeImperium(socket);
        const numImperium = await this.rooms[token].getImperiumCount();
        console.log(`Room ${this.rooms[token].socketRoom}: imperium exited (${numImperium} connected) ${socket.id}`);
        this.cleanRoomIfEmpty(token).catch(err => console.log(err));
        return removed;
    }

    private async cleanRoomIfEmpty(token: string) {
        const numSatelles = this.rooms[token].getSatellesCount();
        const numImperium = await this.rooms[token].getImperiumCount();
        if (numSatelles === 0 && numImperium === 0) {
            console.log(`Cleaning up room ${this.rooms[token].roomName} - ${token}`);
            this.rooms[token].destroy();
            delete this.rooms[token];
        }
    }
}
