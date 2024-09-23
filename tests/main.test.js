const database = require("./database.mock");
const pgDumpRestore = require("../index");
const fs = require("fs-extra");

describe("Can dump and restore database", () => {
  beforeAll(async () => {
    await database.sequelize.sync({ force: true });
    await database.populate();
  });
  test("can dump database", async () => {

    const log = await pgDumpRestore.dump({
      ...database.CREDENTIALS,
      file: "./test.pgdump",
    });

    expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    expect(log.stderr.includes('pg_dump:')).toBeFalsy();

  });
  test("can restore database", async () => {

    await database.sequelize.drop();
    const log = await pgDumpRestore.restore({
      ...database.CREDENTIALS,
      filename: "./test.pgdump",
    });
    allPatients = await database.Patient.findAll();
    expect(allPatients.length).toBe(1);
    expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    expect(log.stderr.includes('pg_restore:')).toBeFalsy();
  });
});
describe("Can dump and restore database (with verbose)", () => {
  beforeAll(async () => {
    await database.sequelize.sync({ force: true });
    await database.populate();
  });
  test("can dump database (With verbose)", async () => {

    const log = await pgDumpRestore.dump({
      ...database.CREDENTIALS,
      verbose: true,
      file: "./test.pgdump",
    });

    expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    expect(log.stderr.includes('pg_dump:')).toBeTruthy();

  });

  test("can restore database (with verbose)", async () => {

    await database.sequelize.drop();
    const log = await pgDumpRestore.restore({
      ...database.CREDENTIALS,
      verbose: true,
      filename: "./test.pgdump",
    });
    allPatients = await database.Patient.findAll();
    expect(allPatients.length).toBe(1);
    expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    expect(log.stderr.includes('pg_restore:')).toBeTruthy();
  });
});
afterAll(async () => {
  await fs.remove("./test.pgdump");
}); 
