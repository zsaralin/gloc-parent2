let dbName = '42'; // Default value

const getDbName = () => dbName;
const setDbName = (newName) => { dbName = newName; };

module.exports = { getDbName, setDbName };