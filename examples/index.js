// The code below is an example of how to use the pg-dump-restore-node-wrapper to traverse
// a database on Amazon RDS, identify if the tables have more records than the local database,
// and then proceed with dumping and restoring each of them.

import pgDumpRestore from "@endodata/pg-dump-restore-node-wrapper";
import asyncForEach from 'async-await-foreach'
import path from 'path';
import fs from 'fs';

(async () => {

    const config = {
        source: {
            host: 'your.domain.sa-east-1.rds.amazonaws.com',
            user: 'admin',
            password: 'loremipsum',
            ssl: { rejectUnauthorized: false }
        },
        target: {
            host: '127.0.0.1',
            user: 'admin',
            password: 'loremipsum'
        }
    };

    //compare databases
    let discrepancies = await pgDumpRestore.compare(config);

    //filter out databases that start with 'u'
    discrepancies = discrepancies.filter(d => d.database.startsWith('u'));

    //filter out databases that are equal
    discrepancies = discrepancies.filter(d => !d.equal);

    //filter out databases that are not in source but in target
    discrepancies = discrepancies.filter(d => !d.slug.includes('but-not-in-source'));

    //filter out only the database name
    discrepancies = discrepancies.map(d => d.database);

    //remove duplicates
    discrepancies = discrepancies.filter((v, i, a) => a.indexOf(v) === i);

    let idx = 0;
    asyncForEach(discrepancies, async dbname => {

        idx++;
        console.log(`⏳ dumping ${dbname} | ${idx}/${discrepancies.length}`);

        const backupFilePath = path.resolve(`./temp${dbname}_${Date.now()}.backup`);

        await pgDumpRestore.dump({
            host: config.source.host,
            username: config.source.user,
            password: config.source.password,
            file: backupFilePath,
            dbname,
            verbose: true,
        });

        await pgDumpRestore.restore({
            host: config.target.host,
            username: config.target.user,
            password: config.target.password,
            filename: backupFilePath,
            dbname,
            verbose: true,
            disableTriggers: true,
            clean: true,
            create: true,
            createWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='en-US' LC_CTYPE='en-US';`
        });

        fs.unlinkSync(backupFilePath);

    });

})();
