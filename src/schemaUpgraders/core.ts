import {v2} from "./draft-02";
import {File} from "../File";
import * as Ajv from "ajv";
import * as path from "path";


export class core {

    schemas = [
        {schema: null, upgradeUsing: null, schemaFile: null},
        {schema: "https://storyplaces.soton.ac.uk/schema/02-draft", upgradeUsing: new v2(), schemaFile: "story.schema.draft-02.json"}
    ];

    upgradeSchema(providedData, validate) {
        if (!validate) {
            validate = false;
        }

        let data = Object.assign({}, providedData);

        let lastVersionIndex = this.schemas.length - 1;

        let currentVersionIndex = this.detectSchemaVersionIndex(data);
        let startingVersionIndex = currentVersionIndex + 1;

        for (let newVersionIndex = startingVersionIndex; newVersionIndex <= lastVersionIndex; newVersionIndex++) {
            data = this.upgradeToSchemaIndex(newVersionIndex, data, validate);
        }

        return data;
    }

    private upgradeToSchemaIndex(newVersionIndex, passedData, validate) {
        let newSchema = Object.assign({}, this.schemas[newVersionIndex].upgradeUsing.upgrade(passedData));
        newSchema.schemaVersion = this.schemas[newVersionIndex].schema;

        if (validate) {
            this.validateSchema(newSchema, path.resolve(__dirname, "..", "..", "schema", this.schemas[newVersionIndex].schemaFile));
        }

        return newSchema;
    }

    private validateSchema(data, schemaFile) {
        let dataToValidate = Object.assign({}, data);

        schemaFile = File.getFullFileName(schemaFile);
        let schema = File.readFileContents(schemaFile);

        let ajv = new Ajv();
        let valid = ajv.validate(JSON.parse(schema), dataToValidate);

        if (!valid) {
            throw ajv.errorsText();
        }

    }

    private detectSchemaVersionIndex(data) {
        if (!data.schemaVersion) {
            return 0;
        }

        return this.schemas.findIndex(schema => schema.schema == data.schemaVersion);
    }
}