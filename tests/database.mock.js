const Sequelize = require("sequelize");
require("pg");

let Users;

const CREDENTIALS = {
  host: "127.0.0.1",
  port: 5432,
  dbname: "pg_dump_restore_tests",
  username: "postgres",
  password: "28F50CD7-CA87-4796-AF3F-4C161483CCE1",
};

let databaseConfig = {
  logging: () => { },
  dialect: "postgres",
  host: CREDENTIALS.host,
  username: CREDENTIALS.username,
  port: CREDENTIALS.port,
  password: CREDENTIALS.password,
};

let sequelizePostgres = new Sequelize({ dialect: databaseConfig.dialect });
let sequelizeTest = new Sequelize({ dialect: databaseConfig.dialect });

const openDatabasePostgress = async () => {

  sequelizePostgres = new Sequelize({ ...databaseConfig, database: 'postgres' });
  await sequelizePostgres.authenticate();

}

const openDatabaseTest = async () => {

  sequelizeTest = new Sequelize({ ...databaseConfig, database: CREDENTIALS.dbname });
  await sequelizeTest.authenticate();

  Users = sequelizeTest.define(
    "Users",
    {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      data: { type: Sequelize.JSON },
      misc: { type: Sequelize.JSON },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      paranoid: true,
    }
  );
  await Users.sync({ force: true });

}

const closeDatabases = async () => {

  await sequelizePostgres.close();
  await sequelizeTest.close();

}

const killAllConnections = async () => {

  await sequelizePostgres.query(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${CREDENTIALS.dbname}'
    AND pid <> pg_backend_pid();
  `);

}

const dropDatabaseIfExists = async () => {

  await openDatabasePostgress()
  await killAllConnections()
  await sequelizePostgres.query(`DROP DATABASE IF EXISTS ${CREDENTIALS.dbname}`);
  await closeDatabases()

}

const createDatabase = async () => {

  await openDatabasePostgress()
  await sequelizePostgres.query(`
    CREATE DATABASE ${CREDENTIALS.dbname}
    WITH TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='en-US' LC_CTYPE='en-US';
  `);
  await sequelizePostgres.sync({ force: true });
  await closeDatabases()

}

const populate = async () => {

  await openDatabaseTest()
  await Users.create(
    {
      id: "p4567",
      data: { wow: 1 },
      misc: {},
    },
    { user_id: "ME" }
  );
  await closeDatabases()

};

const getUsers = async () => {

  await openDatabaseTest()
  return await Users.findAll();

}

async function checkLCCollate() {

  await openDatabaseTest()
  const [result] = await sequelizeTest.query(`
    SELECT datcollate 
    FROM pg_database 
    WHERE datname = '${CREDENTIALS.dbname}'
  `);
  await closeDatabases()

  const lcCollate = result[0].datcollate;
  return lcCollate;
}

module.exports = {
  getUsers,
  sequelize: sequelizeTest,
  createDatabase,
  dropDatabaseIfExists,
  populate,
  checkLCCollate,
  CREDENTIALS
};
