import { globSync } from 'glob';
import { MarciClient } from '@/core/client/ClientClass';
import Event from '@/core/handlers/interfaces/EventInterface';

export class EventHandler {
    constructor(private client: MarciClient) {}

    load() {
        const eventPath = globSync(`${process.cwd()}/src/app/events/**/*.ts`);

        eventPath.map((path) => {
            const event = require(`${process.cwd()}/${path}`).default as Event;
            if (!event.options.once) {
                this.client.on(
                    event.options.name,
                    event.execute.bind(null, this.client)
                );
            } else {
                this.client.once(
                    event.options.name,
                    event.execute.bind(null, this.client)
                );
            }
        });
    }
}
