const Sequelize = require("sequelize");
require("pg");

const CREDENTIALS = {
  host: "127.0.0.1",
  port: 5432,
  dbname: "pg_dump_restore_tests",
  username: "postgres",
};

let databaseConfig = {
  logging: () => {},
  dialect: "postgres",
  host: CREDENTIALS.host,
  database: CREDENTIALS.dbname,
  username: CREDENTIALS.username,
  port: CREDENTIALS.port,
};

let sequelize = new Sequelize(databaseConfig);

const Patient = sequelize.define(
  "patient",
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

const populate = async () => {
  let patient2 = await Patient.create(
    {
      id: "p4567",
      data: { wow: 1 },
      misc: {},
    },
    { user_id: "ME" }
  );
};

module.exports = { Patient, sequelize, populate, CREDENTIALS };
