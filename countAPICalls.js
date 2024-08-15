const fs = require("fs");
const path = require("path");

// JSON file path
const jsonFilePath = path.join(__dirname, "data/apiCallCounts.json");
// Ensure the directory exists
const dir = path.dirname(jsonFilePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Check if the file exists, and create it if it does not
if (!fs.existsSync(jsonFilePath)) {
  fs.writeFileSync(jsonFilePath, JSON.stringify({}), "utf8");
  console.log("File created:", jsonFilePath);
} else {
  console.log("File already exists:", jsonFilePath);
}

let apiCallData = {
  totalCalls: 0,
  routes: {},
};

// Function to initialize or load existing data from JSON file
const loadAPICallData = () => {
  try {
    const jsonData = fs.readFileSync(jsonFilePath);
    apiCallData = JSON.parse(jsonData);
  } catch (err) {
    console.error("Error reading or parsing JSON file:", err);
  }
};

// Load initial data on server start
loadAPICallData();

const countAPICalls = (req, res, next) => {
  const route = req.path;
  const method = req.method;
  //console.log(req.query);
  // Increment total calls
  apiCallData.totalCalls++;

  // Ensure the route exists in the routes object
  if (!apiCallData.routes[route]) {
    apiCallData.routes[route] = {};
  }

  // Increment the count for the specific method
  if (apiCallData.routes[route][method]) {
    apiCallData.routes[route][method]++;
  } else {
    apiCallData.routes[route][method] = 1;
  }

  // Write updated data to JSON file
  fs.writeFile(jsonFilePath, JSON.stringify(apiCallData, null, 2), (err) => {
    if (err) {
      console.error("Error writing API call counts to file:", err);
    }
  });
  //console.log(apiCallData);
  next(); // Move to the next middleware or route handler
};

module.exports = { countAPICalls, apiCallData, loadAPICallData };
