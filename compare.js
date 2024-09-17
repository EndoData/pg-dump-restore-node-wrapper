const pg = require('pg');
const Client = pg.Client;

// Function to connect to the 'postgres' database and get the list of databases
async function listDatabases(host, user, password, ssl) {
    const client = new Client({
        user,
        host,
        database: 'postgres',
        password,
        ssl
    });

    try {
        await client.connect();

        // Get the list of databases (excluding templates)
        const databasesResult = await client.query(`
            SELECT datname AS "database"
            FROM pg_database
            WHERE datistemplate = false;
        `);

        const databases = databasesResult.rows.map(row => row["database"]);
        await client.end();
        return databases;

    } catch (err) {
        console.error(`Error listing databases on host ${host}:`, err);
    }
}

// Function to generate a slug from a given message
function generateSlug(message) {
    return message.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Function to connect to a specific database and get information about its tables, functions, indexes, procedures, etc.
async function getDatabaseObjectsInfo(host, user, password, ssl, database) {
    const client = new Client({
        user,
        host,
        database,
        password,
        ssl
    });

    try {
        await client.connect();

        // Get the list of tables and row counts
        const tablesResult = await client.query(`
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
        `);

        // Get the list of functions
        const functionsResult = await client.query(`
            SELECT 
                routine_name AS "function"
            FROM 
                information_schema.routines
            WHERE 
                routine_type = 'FUNCTION' AND 
                specific_schema = 'public';
        `);

        // Get the list of indexes
        const indexesResult = await client.query(`
            SELECT 
                indexname AS "index"
            FROM 
                pg_indexes
            WHERE 
                schemaname = 'public';
        `);

        // Get the list of procedures
        const proceduresResult = await client.query(`
            SELECT 
                proname AS "procedure"
            FROM 
                pg_proc 
            JOIN 
                pg_namespace n ON n.oid = pg_proc.pronamespace 
            WHERE 
                n.nspname = 'public';
        `);

        // Map results to objects
        const tablesInfo = tablesResult.rows.map(tableRow => ({
            "table": tableRow["table"],
            "rows": tableRow["rows"],
        }));

        const functionsInfo = functionsResult.rows.map(functionRow => functionRow["function"]);
        const indexesInfo = indexesResult.rows.map(indexRow => indexRow["index"]);
        const proceduresInfo = proceduresResult.rows.map(procedureRow => procedureRow["procedure"]);

        await client.end();
        return {
            tables: tablesInfo,
            functions: functionsInfo,
            indexes: indexesInfo,
            procedures: proceduresInfo,
        };

    } catch (err) {
        console.error(`Error getting information for database ${database}:`, err);
    }
}

// Main function to compare the corresponding databases from source and target
async function compareDatabases(sourceConfig, targetConfig) {
    const sourceDatabases = await listDatabases(sourceConfig.host, sourceConfig.user, sourceConfig.password, sourceConfig.ssl);
    const targetDatabases = await listDatabases(targetConfig.host, targetConfig.user, targetConfig.password, targetConfig.ssl);

    const discrepancies = [];

    // Compare databases that exist in both source and target
    for (const sourceDb of sourceDatabases) {
        if (targetDatabases.includes(sourceDb)) {
            const sourceObjects = await getDatabaseObjectsInfo(sourceConfig.host, sourceConfig.user, sourceConfig.password, sourceConfig.ssl, sourceDb);
            const targetObjects = await getDatabaseObjectsInfo(targetConfig.host, targetConfig.user, targetConfig.password, targetConfig.ssl, sourceDb);

            // Compare tables
            sourceObjects.tables.forEach(table1 => {
                const table2 = targetObjects.tables.find(t => t.table === table1.table);
                let message, equal;
                if (table2) {
                    if (table1.rows !== table2.rows) {
                        message = "Row count mismatch";
                        equal = false;
                    } else {
                        message = "Table exists in both source and target with matching rows";
                        equal = true;
                    }
                } else {
                    message = "Table exists in source but not in target";
                    equal = false;
                }
                const slug = generateSlug(message);
                discrepancies.push({
                    type: 'table',
                    slug,
                    equal,
                    database: sourceDb,
                    object: table1.table,
                    sourceRows: table1.rows,
                    targetRows: table2 ? table2.rows : -1,
                    message
                });
            });

            targetObjects.tables.forEach(table2 => {
                if (!sourceObjects.tables.find(t => t.table === table2.table)) {
                    const message = "Table exists in target but not in source";
                    const slug = generateSlug(message);
                    discrepancies.push({
                        type: 'table',
                        slug,
                        equal: false,
                        database: sourceDb,
                        object: table2.table,
                        sourceRows: -1,
                        targetRows: table2.rows,
                        message
                    });
                }
            });

            // Compare functions
            sourceObjects.functions.forEach(func => {
                let message, equal;
                if (targetObjects.functions.includes(func)) {
                    message = "Function exists in both source and target";
                    equal = true;
                } else {
                    message = "Function exists in source but not in target";
                    equal = false;
                }
                const slug = generateSlug(message);
                discrepancies.push({
                    type: 'function',
                    slug,
                    equal,
                    database: sourceDb,
                    object: func,
                    message
                });
            });

            targetObjects.functions.forEach(func => {
                if (!sourceObjects.functions.includes(func)) {
                    const message = "Function exists in target but not in source";
                    const slug = generateSlug(message);
                    discrepancies.push({
                        type: 'function',
                        slug,
                        equal: false,
                        database: sourceDb,
                        object: func,
                        message
                    });
                }
            });

            // Compare indexes
            sourceObjects.indexes.forEach(index => {
                let message, equal;
                if (targetObjects.indexes.includes(index)) {
                    message = "Index exists in both source and target";
                    equal = true;
                } else {
                    message = "Index exists in source but not in target";
                    equal = false;
                }
                const slug = generateSlug(message);
                discrepancies.push({
                    type: 'index',
                    slug,
                    equal,
                    database: sourceDb,
                    object: index,
                    message
                });
            });

            targetObjects.indexes.forEach(index => {
                if (!sourceObjects.indexes.includes(index)) {
                    const message = "Index exists in target but not in source";
                    const slug = generateSlug(message);
                    discrepancies.push({
                        type: 'index',
                        slug,
                        equal: false,
                        database: sourceDb,
                        object: index,
                        message
                    });
                }
            });

            // Compare procedures
            sourceObjects.procedures.forEach(procedure => {
                let message, equal;
                if (targetObjects.procedures.includes(procedure)) {
                    message = "Procedure exists in both source and target";
                    equal = true;
                } else {
                    message = "Procedure exists in source but not in target";
                    equal = false;
                }
                const slug = generateSlug(message);
                discrepancies.push({
                    type: 'procedure',
                    slug,
                    equal,
                    database: sourceDb,
                    object: procedure,
                    message
                });
            });

            targetObjects.procedures.forEach(procedure => {
                if (!sourceObjects.procedures.includes(procedure)) {
                    const message = "Procedure exists in target but not in source";
                    const slug = generateSlug(message);
                    discrepancies.push({
                        type: 'procedure',
                        slug,
                        equal: false,
                        database: sourceDb,
                        object: procedure,
                        message
                    });
                }
            });
        }
    }

    return discrepancies;
}

// Export the function to be used as a library
function compare(config) {
    var sourceConfig = config.source;
    var targetConfig = config.target;

    return compareDatabases(sourceConfig, targetConfig).then(function (discrepancies) {
        return discrepancies;
    });
}

module.exports = compare;

