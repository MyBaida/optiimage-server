const app = require("./src/app");
const cleanup = require("./src/utils/cleanup");

const PORT = process.env.PORT || 3000;

// Run cleanup every hour
setInterval(() => {
  console.log("Running scheduled storage cleanup...");
  cleanup.autoCleanup(["uploads", "processed"]);
}, 60 * 60 * 1000); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});