const Sequelize = require("sequelize");
require("pg");

const CREDENTIALS = {
  host: "127.0.0.1",
  port: 5432,
  dbname: "pg_dump_restore_tests",
  username: "postgres",
  password: "28F50CD7-CA87-4796-AF3F-4C161483CCE1",
};

let databaseConfig = {
  logging: () => {},
  dialect: "postgres",
  host: CREDENTIALS.host,
  database: CREDENTIALS.dbname,
  username: CREDENTIALS.username,
  port: CREDENTIALS.port,
  password: CREDENTIALS.password,
};

let sequelize = new Sequelize(databaseConfig);

const TableA = sequelize.define(
  "tableA",
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
    freezeTableName: true,
  }
);

const TableB = sequelize.define(
  "tableB",
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
    freezeTableName: true,
  }
);

const TableC = sequelize.define(
  "tableC",
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
    freezeTableName: true,
  }
);

const TableD = sequelize.define(
  "tableD",
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
    freezeTableName: true,
  }
);

const populate = async () => {
  await TableA.create({
    id: "elementTableA",
    data: { wow: "A" },
    misc: {},
  });
  await TableB.create({
    id: "elementTableB",
    data: { wow: "B" },
    misc: {},
  });
  await TableC.create({
    id: "elementTableC",
    data: { wow: "C" },
    misc: {},
  });
  await TableD.create({
    id: "elementTableD",
    data: { wow: "D" },
    misc: {},
  });
};

module.exports = {
  TableA,
  TableB,
  TableC,
  TableD,

  sequelize,
  populate,
  CREDENTIALS,
};
