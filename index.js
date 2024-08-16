const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const app = express();
const { countAPICalls, apiCallData } = require("./countAPICalls");
// Use the middleware for all API routes
app.use(countAPICalls);

// Example CORS setup
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Adjust as per your security needs
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
const folderPath = path.join(__dirname, "./uploaded_apps");

// Check if the folder exists
if (!fs.existsSync(folderPath)) {
  // Create the folder if it does not exist
  fs.mkdirSync(folderPath, { recursive: true });
  console.log("Folder created:", folderPath);
} else {
  console.log("Folder already exists:", folderPath);
}
// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //const folderName = req.params.appName;
    const folderPath = path.join(__dirname, "uploaded_apps");
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Object to store port mappings
const appPorts = {};

// Endpoint to handle uploading and extracting zip files
app.post("/api/createApp", upload.single("file"), (req, res) => {
  const update = req.query.update;
  const zipFilePath = req.file.path;
  const folderPath = path.join(__dirname, "uploaded_apps");
  let folder;
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${folderPath}: ${err}`);
      res.status(500).send("Error reading directory");
      return;
    }
    folder = zipFilePath.split("/").pop().split(".")[0];
    console.log(files, folder, files.includes(folder));
    console.log(`Contents: ${files.join(", ")}`);

    if (!files.includes(folder) || (files.includes(folder) && update)) {
      // Extract the uploaded zip file
      fs.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: folderPath }))
        .on("close", () => {
          // Delete the uploaded zip file after extraction
          fs.unlinkSync(zipFilePath);
          console.log(`Zip file extracted to ${folderPath}`);

          // // Assign a new port dynamically (adjust as needed)
          // const port = 8000 + Object.keys(appPorts).length; // Start from port 8000
          // appPorts[appName] = port;
          const fullUrl = `${req.protocol}://${req.get("host")}`;

          // [error] Unable to determine the framework type for angularappsdeployment
          const appUrl = `${fullUrl}/${folder}`; // Example URL structure
          res.json({ appUrl: appUrl });
        })
        .on("error", (err) => {
          console.error("Error extracting zip file:", err);
          res.status(500).json({ error: "Failed to extract zip file" });
        });
    } else {
      res.status(400).json({ error: "Application already exists" });
    }
  });
});
// Endpoint to delete a specific folder
app.delete("/folders/:folderName", (req, res) => {
  const folderName = req.params.folderName;
  const uploadedAppsPath = path.join(__dirname, "uploaded_apps");
  const folderPath = path.join(uploadedAppsPath, folderName);

  fs.rm(folderPath, { recursive: true }, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error deleting folder" });
    }
    res.status(204).send(); // No Content
  });
});
app.get("/folders", (req, res) => {
  const folderPath = path.join(__dirname, "uploaded_apps");
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${folderPath}: ${err}`);
      res.status(500).send("Error reading directory");
      return;
    }
    // const folders = files.filter((file) => file !== "node_modules");
    res.json({ folders: files });
  });
});
app.get("/", (req, res) => {
  const folderPath = path.join(__dirname, "uploaded_apps");
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${folderPath}: ${err}`);
      res.status(500).send("Error reading directory");
      return;
    }
    // const folders = files.filter((file) => file !== "node_modules");
    res.json({ folders: files });
  });
});
// Serve static files for each app dynamically
app.use("/:appName", express.static(path.join(__dirname, "uploaded_apps")));

// Serve static files for each app dynamically
app.use("/:appName", (req, res, next) => {
  const appName = req.params.appName;
  const appPath = path.join(__dirname, "uploaded_apps", appName, "browser");
  express.static(appPath)(req, res, next);
});

// Handle wildcard routes under /apps/:appName to serve index.html
app.get("/:appName/*", (req, res) => {
  const appName = req.params.appName;
  const indexPath = path.join(
    __dirname,
    "uploaded_apps",
    appName,
    "browser",
    "index.html"
  );
  res.sendFile(indexPath);
});

// app.get("/apps/:appName", (req, res) => {
//   const appName = req.params.appName;
//   const appPath = path.join(__dirname, "uploaded_apps", appName, "browser");
//   //express.static(path.join(__dirname, "uploaded_apps", appName, "browser"));

//   // Check if the directory exists
//   if (fs.existsSync(appPath)) {
//     res.sendFile(path.join(appPath, "index.html"));
//   } else {
//     res.status(404).send("App not found");
//   }
// });

// // Endpoint to handle serving the Angular app
// app.get("/apps/:appName", (req, res) => {
//   const appName = req.params.appName;
//   const port = appPorts[appName];

//   // if (!port) {
//   //   return res
//   //     .status(404)
//   //     .json({ error: "App not found or port not assigned" });
//   // }

//   console.log(`App ${appName} is running at http://localhost:${port}`);
//   res.sendFile(
//     path.join(__dirname, "uploaded_apps", appName, "browser", "index.html")
//   );
// });

// Example: Listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
