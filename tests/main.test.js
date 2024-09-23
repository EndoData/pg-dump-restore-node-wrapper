const database = require("./database.mock");
const pgDumpRestore = require("../index");
const fs = require("fs-extra");

describe("Can dump and restore database", () => {
  beforeAll(async () => {
    await database.sequelize.sync({ force: true });
    await database.populate();
  });
  describe("Can dump", () => {
    test("can dump database", async () => {
      expect.assertions(1);
      await pgDumpRestore.dump({
        ...database.CREDENTIALS,
        file: "./test.pgdump",
      });
      expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    });
  });
  describe("Can dump (with verbose)", () => {
    test("can dump database", async () => {
      expect.assertions(1);
      await pgDumpRestore.dump({
        ...database.CREDENTIALS,
        verbose: true,
        file: "./test.pgdump",
      });
      expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    });
  });
  describe("Can restore", () => {
    test("can restore database", async () => {
      expect.assertions(1);
      await database.sequelize.drop();
      await pgDumpRestore.restore({
        ...database.CREDENTIALS,
        filename: "./test.pgdump",
      });
      allPatients = await database.Patient.findAll();
      expect(allPatients.length).toBe(1);
    });
  });
  afterAll(async () => {
    await fs.remove("./test.pgdump");
  });
});
