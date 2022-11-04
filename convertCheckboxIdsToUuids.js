'use strict';

const fs = require('fs');
const uuid = require('uuid');

const checkboxFile = 'eldenring.checkboxes.json';

const checkboxData = JSON.parse(fs.readFileSync(checkboxFile));

const checkboxUuids = [];
let newUuidCount = 0;

console.log(`Reading "${checkboxFile}" ...`)

for (const section in checkboxData.list) {
    const newCheckboxes = {};

    for (const oldUuid in checkboxData.list[section]) {
        const newUuid = uuid.validate(oldUuid) ? oldUuid : uuid.v4();

        if (newUuid !== oldUuid) {
            newUuidCount++;
        }

        if (checkboxUuids.includes(newUuid)) {
            throw new Error('Duplicate uuid found: ' + newUuid);
        }

        checkboxUuids.push(newUuid);
        newCheckboxes[newUuid] = checkboxData.list[section][oldUuid]
    }

    checkboxData.list[section] = newCheckboxes;
}

if (newUuidCount === 0) {
    console.log('No ids needed updating.');
} else {
    fs.writeFileSync(checkboxFile, JSON.stringify(checkboxData, null, 2));
    console.log(`Updated ${newUuidCount} ids to proper UUIDs.`);
}
