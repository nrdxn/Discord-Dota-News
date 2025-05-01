import { Collection } from 'discord.js';
import { globSync } from 'glob';
import Component from '@/core/handlers/interfaces/ComponentInterface';

export class ComponentsHandler {
    public readonly cache: Collection<string, Component> = new Collection();

    constructor() {}

    load() {
        const componentsPath = globSync(
            `${process.cwd()}/src/app/interactions/components/**/*.ts`
        );

        componentsPath.map((path) => {
            const component = require(`${process.cwd()}/${path}`)
                .default as Component;

            if (component) {
                this.cache.set(component.options.name, component);
            }
        });
    }
}
