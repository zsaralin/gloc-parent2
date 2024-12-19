let dbName = 'arg'; // Default value

const getDbName = () => dbName;
const setDbName = (newName) => { dbName = newName; };

module.exports = { getDbName, setDbName };