const Sequelize = require("sequelize");
const psql = require("../lib/psql");

const Mocks = {}
Mocks['Table1'] = {
  model: null,
  data: {
    id: `p${Math.floor(Math.random() * 1000)}`,
    name: `row_from_table_1`,
    data: { wow: Math.floor(Math.random() * 1000) },
    misc: {}
  }
}
Mocks['Table2'] = {
  model: null,
  data: {
    id: `p${Math.floor(Math.random() * 1000)}`,
    name: `row_from_table_2`,
    data: { wow: Math.floor(Math.random() * 1000) },
    misc: {}
  }
}

const CREDENTIALS = {
  host: "127.0.0.1",
  port: 5432,
  username: "postgres",
  password: "28F50CD7-CA87-4796-AF3F-4C161483CCE1",
};
const DATABASES = {
  tests: "pg_dump_restore_tests"
}

let databaseConfig = {
  logging: () => { },
  dialect: "postgres",
  host: CREDENTIALS.host,
  username: CREDENTIALS.username,
  port: CREDENTIALS.port,
  password: CREDENTIALS.password,
};

let sequelizeTest = new Sequelize({ dialect: databaseConfig.dialect });

const openDatabase = async (database) => {

  sequelizeTest = new Sequelize({ ...databaseConfig, database });
  await sequelizeTest.authenticate();

}

const prepareData = async (tableName, force) => {

  Mocks[tableName].model = sequelizeTest.define(
    tableName,
    {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
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
  await Mocks[tableName].model.sync({ force });

}


const populeWithMore = async (database, tableName) => {

  await createAndPopule(database, tableName, false)

}

const createAndPopule = async (database, tableName, sync = true) => {

  await openDatabase(database)
  await prepareData(tableName, sync)
  await Mocks[tableName].model.create(Mocks[tableName].data);
  await closeDatabases()

}

const getData = async (database, tableName) => {

  await openDatabase(database)
  await prepareData(tableName)
  return await Mocks[tableName].model.findAll();

}

const closeDatabases = async () => {

  await sequelizeTest.close();

}

const dropDatabaseIfExists = async (database) => {

  await psql.killAllConnections(CREDENTIALS, { dbname: database })
  await psql.dropDatabaseIfExists(CREDENTIALS, { dbname: database })

}

const createDatabase = async (database) => {

  await psql.createDatabase(CREDENTIALS,
    {
      dbname: database,
      createWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='en-US' LC_CTYPE='en-US';`
    })

}

module.exports = {
  getData,
  sequelize: sequelizeTest,
  createDatabase,
  dropDatabaseIfExists,
  createAndPopule,
  populeWithMore,
  CREDENTIALS,
  DATABASES
};
