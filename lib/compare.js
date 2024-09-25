const psql = require('./psql');

function buildCredentials(host, user, password, ssl, database) {
    return {
        host,
        port: ssl ? 5432 : undefined,
        username: user,
        password,
        dbname: database
    };
}

async function listDatabases(host, user, password, ssl) {
    const credentials = buildCredentials(host, user, password, ssl, 'postgres');
    const result = await psql.listDatabases(credentials, {});
    return result.rows.map(row => row["database"]);
}

async function getDatabaseObjectsInfo(host, user, password, ssl, database) {
    const credentials = buildCredentials(host, user, password, ssl, database);
    const tablesResult = await psql.getTablesInfo(credentials, {});
    const functionsResult = await psql.getFunctionsInfo(credentials, {});
    const indexesResult = await psql.getIndexesInfo(credentials, {});
    const proceduresResult = await psql.getProceduresInfo(credentials, {});

    const tablesInfo = tablesResult.rows.map(tableRow => ({
        "table": tableRow["table"],
        "rows": tableRow["rows"],
    }));

    const functionsInfo = functionsResult.rows.map(functionRow => functionRow["function"]);
    const indexesInfo = indexesResult.rows.map(indexRow => indexRow["index"]);
    const proceduresInfo = proceduresResult.rows.map(procedureRow => procedureRow["procedure"]);

    return {
        tables: tablesInfo,
        functions: functionsInfo,
        indexes: indexesInfo,
        procedures: proceduresInfo,
    };
}

async function compareDatabases(sourceConfig, targetConfig) {
    const sourceDatabases = await listDatabases(sourceConfig.host, sourceConfig.user, sourceConfig.password, sourceConfig.ssl);
    const targetDatabases = await listDatabases(targetConfig.host, targetConfig.user, targetConfig.password, targetConfig.ssl);

    const discrepancies = [];

    for (const sourceDb of sourceDatabases) {
        if (targetDatabases.includes(sourceDb)) {
            const sourceObjects = await getDatabaseObjectsInfo(sourceConfig.host, sourceConfig.user, sourceConfig.password, sourceConfig.ssl, sourceDb);
            const targetObjects = await getDatabaseObjectsInfo(targetConfig.host, targetConfig.user, targetConfig.password, targetConfig.ssl, sourceDb);

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

function compare(config) {
    var sourceConfig = config.source;
    var targetConfig = config.target;

    return compareDatabases(sourceConfig, targetConfig).then(function (discrepancies) {
        return discrepancies;
    });
}

module.exports = compare;

function generateSlug(message) {
    return message.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
