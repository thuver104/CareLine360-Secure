/**
 * Artillery Performance Processor
 * Custom functions for Artillery test scenarios
 */

module.exports = {
  /**
   * Setup function - runs once before the test
   */
  setup: function (context, ee, next) {
    console.log("Starting performance test...");
    next();
  },

  /**
   * Cleanup function - runs once after the test
   */
  cleanup: function (context, ee, next) {
    console.log("Performance test completed!");
    next();
  },

  /**
   * Before request - modify request before sending
   */
  beforeRequest: function (requestParams, context, ee, next) {
    // Add custom headers if needed
    requestParams.headers["User-Agent"] = "Artillery Performance Test";
    requestParams.headers["X-Test-ID"] = context.scenario.flow[0].name;
    next();
  },

  /**
   * After response - process response data
   */
  afterResponse: function (requestParams, responseParams, context, ee, next) {
    if (responseParams.statusCode === 200) {
      console.log(
        `✓ ${requestParams.method} ${requestParams.url} - ${responseParams.statusCode}`,
      );
    } else {
      console.log(
        `✗ ${requestParams.method} ${requestParams.url} - ${responseParams.statusCode}`,
      );
    }

    // Track response times
    ee.emit("customStat", {
      stat: "response_time",
      value: responseParams.rtt,
    });

    next();
  },

  /**
   * Custom function to generate random dates
   */
  randomDate: function (context, next) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    context.vars.randomDate = tomorrow.toISOString();
    next();
  },

  /**
   * Custom function to generate UUID
   */
  generateUUID: function (context, next) {
    context.vars.uuid = require("crypto").randomUUID();
    next();
  },
};
