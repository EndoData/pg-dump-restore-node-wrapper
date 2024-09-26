const { Client } = require("pg");

const createClient = (credentials) => {
    return new Client({
        host: credentials.host,
        port: credentials.port,
        database: credentials.dbname || 'postgres',
        user: credentials.username,
        password: credentials.password
    });
};

const executeQuery = async (credentials, query) => {
    const client = createClient(credentials);
    await client.connect();

    const result = await client.query(query);
    await client.end();

    return result;
};

const killAllConnections = async (credentials, args) => {
    const dbname = args.dbname;
    const verbose = args.verbose;

    if (verbose) {
        console.info(`Killing all connections to ${dbname} using psql...`);
    }

    const query = `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbname}'
        AND pid <> pg_backend_pid();
    `;

    const result = await executeQuery(credentials, query);

    if (verbose) {
        console.info(`All connections to ${dbname} killed successfully.`);
    }

    return result;
};

const dropDatabaseIfExists = async (credentials, args) => {
    const dbname = args.dbname;
    const verbose = args.verbose;

    if (verbose) {
        console.info(`Dropping ${dbname} using psql...`);
    }

    const query = `DROP DATABASE IF EXISTS ${dbname};`;

    const result = await executeQuery(credentials, query);

    if (verbose) {
        console.info(`Database ${dbname} dropped successfully.`);
    }

    return result;
};

const createDatabase = async (credentials, args) => {
    const dbname = args.dbname;
    const createWith = args.createWith;
    const verbose = args.verbose;

    if (verbose) {
        console.info(`Creating ${dbname} using psql...`);
    }

    const query = `CREATE DATABASE ${dbname}${createWith ? ' WITH ' + createWith : ''};`;

    const result = await executeQuery(credentials, query);

    if (verbose) {
        console.info(`Database ${dbname} created successfully.`);
    }

    return result;
};

const cleanDatabase = async (credentials, args) => {
    const dbname = credentials.dbname;
    const verbose = args.verbose;

    if (verbose) {
        console.info(`Cleaning ${dbname} using psql...`);
    }

    const query = `
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
    `;

    const result = await executeQuery(credentials, query);

    if (verbose) {
        console.info(`Database ${dbname} cleaned successfully.`);
    }

    return result;
};

const checkLCCollate = async (credentials, args) => {
    const dbname = args.dbname;
    const verbose = args.verbose;

    if (verbose) {
        console.info(`Checking LC_COLLATE for ${dbname} using psql...`);
    }

    const query = `
        SELECT datcollate 
        FROM pg_database 
        WHERE datname = '${dbname}'
    `;

    const result = await executeQuery(credentials, query);

    const lcCollate = result.rows[0].datcollate;
    return lcCollate;
};

const listDatabases = async (credentials, args) => {
    const query = `
        SELECT datname AS "database"
        FROM pg_database
        WHERE datistemplate = false;
    `;

    return executeQuery(credentials, query);
};

const getTablesInfo = async (credentials, args) => {
    const query = `
        SELECT 
            t.relname AS "table", 
            s.n_live_tup AS "rows"
        FROM 
            pg_catalog.pg_stat_user_tables s
        JOIN 
            pg_catalog.pg_class t ON t.oid = s.relid
        WHERE 
            s.schemaname = 'public'
        ORDER BY 
            t.relname;
    `;

    return executeQuery(credentials, query);
};

const getFunctionsInfo = async (credentials, args) => {
    const query = `
        SELECT 
            routine_name AS "function"
        FROM 
            information_schema.routines
        WHERE 
            routine_type = 'FUNCTION' AND 
            specific_schema = 'public';
    `;

    return executeQuery(credentials, query);
};

const getIndexesInfo = async (credentials) => {
    const query = `
        SELECT 
            indexname AS "index"
        FROM 
            pg_indexes
        WHERE 
            schemaname = 'public';
    `;

    return executeQuery(credentials, query);
};

const getProceduresInfo = async (params) => {
    const query = `
        SELECT 
            proname AS "procedure"
        FROM 
            pg_proc 
        JOIN 
            pg_namespace n ON n.oid = pg_proc.pronamespace 
        WHERE 
            n.nspname = 'public';
    `;

    return executeQuery(params, query);
};

module.exports = {
    createDatabase,
    killAllConnections,
    dropDatabaseIfExists,
    cleanDatabase,
    checkLCCollate,
    listDatabases,
    getTablesInfo,
    getFunctionsInfo,
    getIndexesInfo,
    getProceduresInfo
};
