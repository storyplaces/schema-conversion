import {v2} from "./draft-02";
export class core {

    schemas = [
        {schema: undefined, upgradeUsing: undefined},
        {schema: "https://storyplaces.soton.ac.uk/schema/02-draft", upgradeUsing: new v2()}
    ];

    upgradeSchema(providedData) {
        let data = Object.assign({}, providedData);

        let lastVersionIndex = this.schemas.length - 1;

        let currentVersionIndex = this.detectSchemaVersionIndex(data);
        let startingVersionIndex = currentVersionIndex + 1;

        for (let newVersionIndex = startingVersionIndex; newVersionIndex <= lastVersionIndex; newVersionIndex++) {
            data = this.upgradeToSchemaIndex(newVersionIndex, data);
        }

        return data;
    }

    private upgradeToSchemaIndex(newVersionIndex, passedData) {
        let newSchema = Object.assign({}, this.schemas[newVersionIndex].upgradeUsing.upgrade(passedData));
        newSchema.schemaVersion = this.schemas[newVersionIndex].schema;
        return newSchema;
    }

    private detectSchemaVersionIndex(data) {
        if (!data.schemaVersion) {
            return 0;
        }

        return this.schemas.findIndex(schema => schema.schema == data.schemaVersion);
    }
}