const Sequelize = require("sequelize");
const psql = require("../lib/psql");

let DataMock;
let DataMockExtra;

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

}

const prepareDataMock = async (force) => {

  DataMock = sequelizeTest.define(
    "DataMock",
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
      freezeTableName: true
    }
  );
  await DataMock.sync({ force });

}

const prepareDataMockExtra = async (force) => {

  DataMockExtra = sequelizeTest.define(
    "DataMockExtra",
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
      freezeTableName: true
    },
  );
  await DataMockExtra.sync({ force });

}

const createAndPopuleExtraTableMock = async () => {

  await openDatabaseTest()
  await prepareDataMockExtra(true)
  await DataMockExtra.create(
    {
      id: "p1234",
      data: { wow: 9 },
      misc: {},
    },
    { user_id: "OTHER" }
  );

  await closeDatabases()
}

const createAndPopuleTableMock = async () => {

  await openDatabaseTest()
  await prepareDataMock(true)
  await DataMock.create(
    {
      id: "p4567",
      data: { wow: 1 },
      misc: {},
    },
    { user_id: "ME" }
  );

  await closeDatabases()

}

const closeDatabases = async () => {

  await sequelizePostgres.close();
  await sequelizeTest.close();

}

const dropDatabaseIfExists = async () => {

  await openDatabasePostgress()
  await psql.killAllConnections({ args: CREDENTIALS })
  await psql.dropDatabaseIfExists({ args: CREDENTIALS })
  await closeDatabases()

}

const createDatabase = async () => {

  await openDatabasePostgress()
  await psql.createDatabase({
    args: CREDENTIALS,
    createWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='en-US' LC_CTYPE='en-US';`
  })
  await closeDatabases()

}

const getDataMock = async () => {

  await openDatabaseTest()
  await prepareDataMock()
  return await DataMock.findAll();

}

const getDataMockExtra = async () => {

  await openDatabaseTest()
  await prepareDataMockExtra()
  return await DataMockExtra.findAll();

}

const checkLCCollate = async () => {

  await openDatabaseTest()
  await psql.checkLCCollate({ args: CREDENTIALS })
  await closeDatabases()

  const lcCollate = result[0].datcollate;
  return lcCollate;
}

module.exports = {
  getDataMock,
  getDataMockExtra,
  sequelize: sequelizeTest,
  createDatabase,
  dropDatabaseIfExists,
  createAndPopuleTableMock,
  createAndPopuleExtraTableMock,
  checkLCCollate,
  CREDENTIALS
};
