const { Client } = require("pg");

const killAllConnections = async (params) => {

    const args = params.args;
    const dbname = params.args.dbname;
    const verbose = params.args.verbose;

    if (verbose) {
        console.info(`Killing all connections to ${dbname} using psql...`);
    }

    const client = new Client({
        host: args.host,
        port: args.port,
        database: 'postgres',
        user: args.username,
        password: args.password
    });

    await client.connect();
    await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbname}'
        AND pid <> pg_backend_pid();
    `);
    await client.end();

    if (verbose) {
        console.info(`All connections to ${dbname} killed successfully.`);
    }


}

const dropDatabaseIfExists = async (params) => {

    const args = params.args;
    const dbname = params.args.dbname;
    const verbose = params.args.verbose;

    if (verbose) {
        console.info(`Dropping ${dbname} using psql...`);
    }

    const client = new Client({
        host: args.host,
        port: args.port,
        database: 'postgres',
        user: args.username,
        password: args.password
    });

    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS ${dbname};`);
    await client.end();

    if (verbose) {
        console.info(`Database ${dbname} dropped successfully.`);
    }

}

const createDatabase = async (params) => {

    const dbname = params.args.dbname;
    const args = params.args;
    const createWith = params.args.createWith;
    const verbose = params.args.verbose;

    if (verbose) {
        console.info(`Creating ${dbname} using psql...`);
    }

    const client = new Client({
        host: args.host,
        port: args.port,
        database: 'postgres',
        user: args.username,
        password: args.password
    });

    await client.connect();
    await client.query(`CREATE DATABASE ${dbname}${createWith ? ' WITH ' + createWith : ''};`);
    await client.end();

    if (verbose) {
        console.info(`Database ${dbname} created successfully.`);
    }

}

const cleanDatabase = async (params) => {

    const args = params.args;
    const verbose = params.args.verbose;

    if (verbose) {
        console.info(`Cleaning ${dbname} using psql...`);
    }

    const client = new Client({
        host: args.host,
        port: args.port,
        database: args.dbname,
        user: args.username,
        password: args.password
    });

    await client.connect();
    await client.query(`
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$; 
    `);
    await client.end();

    if (verbose) {
        console.info(`Database ${dbname} cleaned successfully.`);
    }

}

const checkLCCollate = async (params) => {

    const args = params.args;
    const dbname = params.args.dbname;
    const verbose = params.args.verbose;

    if (verbose) {
        console.info(`Checking LC_COLLATE for ${dbname} using psql...`);
    }

    const client = new Client({
        host: args.host,
        port: args.port,
        database: 'postgres',
        user: args.username,
        password: args.password
    });

    await client.connect();
    const data = await client.query(`
        SELECT datcollate 
        FROM pg_database 
        WHERE datname = '${dbname}'
    `);
    await client.end();

    const lcCollate = data.rows[0].datcollate;
    return lcCollate;

}

module.exports = {
    createDatabase,
    killAllConnections,
    dropDatabaseIfExists,
    cleanDatabase,
    checkLCCollate
};

