/**
 * Patient CSV Payload for Artillery Performance Testing
 * Usage: CSV file with patient credentials for concurrent testing
 */

// This file should be created as patient-payload.csv in the same directory
// Format:
// email,password
// patient1@example.com,Password@123
// patient2@example.com,Password@123
// patient3@example.com,Password@123
// ...

// Example JavaScript code to generate CSV payload:
const fs = require("fs");

function generatePatientPayload(count = 100) {
  let csv = "email,password\n";

  for (let i = 1; i <= count; i++) {
    csv += `patient${i}@example.com,Password@123\n`;
  }

  fs.writeFileSync("patient-payload.csv", csv);
  console.log(`Generated ${count} patient records in patient-payload.csv`);
}

// Run: node generate-payload.js
generatePatientPayload(100);
