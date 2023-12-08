import React, { useState, useEffect } from "react";
import axios from "axios";

function OpenAIStatusTracker() {
  const [apiName, setApiName] = useState("");
  const [apiStatus, setApiStatus] = useState("");
  const [apiUptime, setApiUptime] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get("https://status.openai.com/");
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(response.data, "text/html");
        const apiStatusElement = htmlDoc.querySelector(
          'div[data-component-id="scd0s93nldpb"]'
        );
        if (apiStatusElement) {
          const name = apiStatusElement
            .querySelector(".name")
            .textContent.trim();
          const status = apiStatusElement
            .querySelector(".component-status")
            .textContent.trim();
          const uptime = apiStatusElement
            .querySelector("#uptime-percent-scd0s93nldpb var")
            .textContent.trim();
          setApiName(name);
          setApiStatus(status);
          setApiUptime(uptime);
        }
      } catch (error) {
        console.error("Error fetching API status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Fetch status every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const getStatusColor = () => {
    switch (apiStatus) {
      case "Operational":
        return "operational";
      case "Down":
        return "down";
      case "Low":
        return "performance-low";
      case "Medium":
        return "performance-medium";
      case "High":
        return "performance-high";
      default:
        return "";
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className={`openai-status-tracker ${statusColor}`}>
      <p>OpenAI API Status</p>
      <p>Name: {apiName}</p>
      <p>Status: {apiStatus}</p>
      <p>Uptime: {apiUptime}%</p>
    </div>
  );
}

export default OpenAIStatusTracker;