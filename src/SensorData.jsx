import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { onValue , ref} from "firebase/database";
import { database } from './firebase'


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Using Gemini AI configuration from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = import.meta.env.VITE_GEMINI_API_URL;

const MAX_DATA_POINTS = 20; // Maximum number of data points to show in charts

const Chatbot = () => {
  const [prompt, setPrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [errorList, setErrorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [showPrecautions, setShowPrecautions] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(!API_KEY);

  // Real-time sensor data simulation
  const [sensorData, setSensorData] = useState({
    humidity: 79,
    tds: 7,
    temperature: 34.2,
    turbidity: 12.5,
    ph: 6.8, // Added pH value
  });


  useEffect(() => {
    const dbRef = ref(database, "sensorData"); // Replace with your actual path

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val());
        console.log(snapshot.val());
      } else {
        console.log("No data available");
      }
    });

    // Cleanup function to unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);







  const [sensorHistory, setSensorHistory] = useState({
    temperature: [],
    humidity: [],
    tds: [],
    turbidity: [],
    ph: [],
    timestamps: []
  });

  // Water quality precaution data for greywater reuse
  const waterQualityGuidelines = [
    { parameter: "TDS (ppm)", safe: "< 500", warning: "500-1500", critical: "> 1500", description: "Affects taste and plant health" },
    { parameter: "Turbidity (NTU)", safe: "< 5", warning: "5-10", critical: "> 10", description: "Indicates suspended particles and clarity" },
    { parameter: "pH", safe: "6.5-8.5", warning: "6.0-6.5 or 8.5-9.0", critical: "< 6.0 or > 9.0", description: "Affects disinfection, corrosion, and plant health" }
  ];

  // // Simulate real-time sensor updates
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const newData = {
  //       humidity: Math.floor(sensorData.humidity + (Math.random() * 4) - 2),
  //       tds: Math.max(0, +(sensorData.tds + (Math.random() * 1) - 0.5).toFixed(1)),
  //       temperature: +(sensorData.temperature + (Math.random() * 0.6) - 0.3).toFixed(1),
  //       turbidity: +(sensorData.turbidity + (Math.random() * 1) - 0.5).toFixed(1),
  //       ph: +(sensorData.ph + (Math.random() * 0.2) - 0.1).toFixed(1)
  //     };

  //     setSensorData(newData);
      
  //     // Update sensor history
  //     const now = new Date();
  //     const timeString = now.toLocaleTimeString();
      
  //     setSensorHistory(prev => {
  //       const newHistory = {
  //         temperature: [...prev.temperature, newData.temperature],
  //         humidity: [...prev.humidity, newData.humidity],
  //         tds: [...prev.tds, newData.tds],
  //         turbidity: [...prev.turbidity, newData.turbidity],
  //         ph: [...prev.ph, newData.ph],
  //         timestamps: [...prev.timestamps, timeString]
  //       };

  //       // Keep only the last MAX_DATA_POINTS
  //       if (newHistory.timestamps.length > MAX_DATA_POINTS) {
  //         return {
  //           temperature: newHistory.temperature.slice(-MAX_DATA_POINTS),
  //           humidity: newHistory.humidity.slice(-MAX_DATA_POINTS),
  //           tds: newHistory.tds.slice(-MAX_DATA_POINTS),
  //           turbidity: newHistory.turbidity.slice(-MAX_DATA_POINTS),
  //           ph: newHistory.ph.slice(-MAX_DATA_POINTS),
  //           timestamps: newHistory.timestamps.slice(-MAX_DATA_POINTS)
  //         };
  //       }
  //       return newHistory;
  //     });
  //   }, 5000);
    
  //   return () => clearInterval(interval);
  // }, []);

  // Check for API key on mount
  useEffect(() => {
    if (!API_KEY) {
      console.warn("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
      setApiKeyError(true);
    }
  }, []);

  // Function to determine status color based on sensor values
  const getStatusColor = (value, type) => {
    if (type === "humidity") {
      return value < 60 ? "warning" : value > 90 ? "danger" : "success";
    } else if (type === "tds") {
      return value < 5 ? "warning" : value > 10 ? "danger" : "success";
    } else if (type === "temperature") {
      return value < 20 ? "warning" : value > 35 ? "danger" : "success";
    } else if (type === "turbidity") {
      return value < 5 ? "success" : value > 15 ? "danger" : "warning";
    } else if (type === "ph") {
      return value < 6.5 || value > 8.5 ? (value < 6.0 || value > 9.0 ? "danger" : "warning") : "success";
    }
    return "";
  };
  
  // Function to get badge background color based on status
  const getBadgeBackground = (status) => {
    if (darkMode) {
      if (status === "success") return "bg-success";
      if (status === "warning") return "bg-warning text-dark";
      if (status === "danger") return "bg-danger";
    } else {
      if (status === "success") return "bg-success";
      if (status === "warning") return "bg-warning text-dark";
      if (status === "danger") return "bg-danger";
    }
    return "bg-secondary";
  };
  
  // Function to get text color based on status
  const getTextColor = (status) => {
    if (status === "success") return "text-success";
    if (status === "warning") return "text-warning";
    if (status === "danger") return "text-danger";
    return "";
  };

  const handleSend = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    if (!API_KEY) {
      setResponseText("Error: API key not configured.");
      return;
    }

    setLoading(true);
    // Include sensor data context in the prompt
    const contextualPrompt = `Current sensor readings:
    Temperature: ${sensorData.temperature}°C
    Humidity: ${sensorData.humidity}%
    TDS: ${sensorData.tds} ppm
    Turbidity: ${sensorData.turbidity} NTU
    pH: ${sensorData.ph}
    
    User question: ${prompt}`;

    const userMessage = { role: "user", content: prompt };
    setConversation(prev => [...prev, userMessage]);
    
    try {
      console.log("Sending request to Gemini API...");
      console.log("API URL:", API_URL);
      
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: contextualPrompt
            }]
          }]
        }),
      });
      
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.error?.message || 
          `HTTP error! status: ${response.status}`
        );
      }
      
      const data = JSON.parse(responseText);
      console.log("Parsed API Response:", data);
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response generated from AI");
      }

      const reply = data.candidates[0]?.content?.parts?.[0]?.text || "No response from AI.";
      console.log("AI Reply:", reply);
      
      processResponse(reply);
      setConversation(prev => [...prev, { role: "assistant", content: reply }]);

      // Save conversation to localStorage
      const updatedConversation = [...conversation, userMessage, { role: "assistant", content: reply }];
      localStorage.setItem('waterMonitorConversation', JSON.stringify(updatedConversation));
    } catch (error) {
      console.error("Detailed error information:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage;
      
      if (error.message.includes('API key')) {
        errorMessage = "Error: Invalid API key. Please check your API key configuration.";
      } else if (error.message.includes('CORS')) {
        errorMessage = "Error: CORS issue detected. This might be a browser security restriction.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Error: Network connection issue. Please check your internet connection.";
      } else if (error.message.includes('No response generated')) {
        errorMessage = "Error: The AI model did not generate a response. Please try again.";
      } else {
        errorMessage = `Error: ${error.message || 'Unable to fetch response. Please try again later.'}`;
      }
      
      setResponseText(errorMessage);
      setCodeBlocks([]);
      setErrorList([]);
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: errorMessage
      }]);
    }
    
    setPrompt("");
    setLoading(false);
  };

  const processResponse = (response) => {
    const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
    const errorRegex = /\d+\.\s(.*?)[:\n]/g;

    let match;
    let extractedCode = [];
    let extractedErrors = [];
    let plainText = response;

    // Extract code blocks
    while ((match = codeRegex.exec(response)) !== null) {
      extractedCode.push({
        language: match[1] || "javascript",
        code: match[2],
      });

      // Remove code from plain text
      plainText = plainText.replace(match[0], "").trim();
    }

    // Extract errors
    while ((match = errorRegex.exec(response)) !== null) {
      extractedErrors.push(match[1]);
    }

    setResponseText(plainText);
    setCodeBlocks(extractedCode);
    setErrorList(extractedErrors);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const togglePrecautions = () => {
    setShowPrecautions(!showPrecautions);
  };

  // Load conversation history from localStorage on component mount
  useEffect(() => {
    const savedConversation = localStorage.getItem('waterMonitorConversation');
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation);
        setConversation(parsed);
      } catch (error) {
        console.error("Error loading conversation history:", error);
        localStorage.removeItem('waterMonitorConversation');
      }
    }
  }, []);

  // Clear conversation history
  const clearConversation = () => {
    setConversation([]);
    localStorage.removeItem('waterMonitorConversation');
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#E0E0E0' : '#333'
        }
      },
      title: {
        display: true,
        color: darkMode ? '#E0E0E0' : '#333'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: darkMode ? '#E0E0E0' : '#333'
        }
      },
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: darkMode ? '#E0E0E0' : '#333'
        }
      }
    }
  };

  // Chart data
  const getChartData = (label, data, color) => ({
    labels: sensorHistory.timestamps,
    datasets: [
      {
        label,
        data: data,
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.4,
        fill: true
      }
    ]
  });

  return (
    <div className={`container-fluid p-0 ${darkMode ? 'bg-gray-900 text-light' : 'bg-light'}`} style={{
      minHeight: "100vh", 
      backgroundColor: darkMode ? "#121212" : "",
      transition: "background-color 0.3s ease, color 0.3s ease"
    }}>
      {apiKeyError && (
        <div className="alert alert-warning m-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          API key not configured! Please add VITE_GEMINI_API_KEY to your .env file and restart the development server.
        </div>
      )}
      <nav className={`navbar navbar-expand-lg ${darkMode ? 'navbar-dark' : 'navbar-light bg-white'} shadow-sm`} 
        style={{backgroundColor: darkMode ? "#1E1E1E" : ""}}>
        <div className="container">
          <span className="navbar-brand mb-0 h1">
            <i className="bi bi-droplet-fill me-2" style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}></i>
            <span style={{color: darkMode ? "#50C8FF" : "#0d6efd", fontWeight: "700"}}>Water</span>Monitor AI Dashboard
          </span>
          <div>
            <button 
              className={`btn me-2 ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`}
              onClick={togglePrecautions}
              style={{borderWidth: "2px"}}
            >
              <i className="bi bi-clipboard-data me-1"></i>
              {showPrecautions ? 'Hide Guidelines' : 'Show Water Guidelines'}
            </button>
            <button 
              className={`btn ${darkMode ? 'btn-outline-light' : 'btn-dark'}`}
              onClick={toggleDarkMode}
              style={{borderWidth: darkMode ? "2px" : "1px"}}
            >
              <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon'} me-1`}></i>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </nav>
      
      <div className="container mt-4">
        <div className="row">
          {/* Water Quality Guidelines */}
          {showPrecautions && (
            <div className="col-lg-12 mb-4">
              <div className={`p-3 rounded shadow-sm ${darkMode ? 'border border-secondary' : 'bg-white'}`} style={{
                backgroundColor: darkMode ? "#2D2D2D" : "",
                boxShadow: darkMode ? "0 0 15px rgba(0, 0, 0, 0.5)" : ""
              }}>
                <h4 className="mb-3" style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                  <i className="bi bi-shield-check me-2"></i> 
                  Greywater Reuse Safety Guidelines
                </h4>
                <div className="table-responsive">
                  <table className={`table ${darkMode ? 'table-dark' : 'table-striped'}`} style={{
                    backgroundColor: darkMode ? "#252525" : "",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}>
                    <thead style={{backgroundColor: darkMode ? "#333333" : ""}}>
                      <tr>
                        <th>Parameter</th>
                        <th className="text-success">Safe Range</th>
                        <th className="text-warning">Warning Range</th>
                        <th className="text-danger">Critical Range</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waterQualityGuidelines.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <strong style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                              {item.parameter}
                            </strong>
                          </td>
                          <td className="text-success" style={{color: darkMode ? "#4dff4d" : "#198754"}}>
                            {item.safe}
                          </td>
                          <td className="text-warning" style={{color: darkMode ? "#ffcc00" : "#ffc107"}}>
                            {item.warning}
                          </td>
                          <td className="text-danger" style={{color: darkMode ? "#ff6666" : "#dc3545"}}>
                            {item.critical}
                          </td>
                          <td>{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5" className={`${darkMode ? 'text-light' : 'text-muted'} small`}>
                          <i className="bi bi-info-circle me-2"></i>
                          These guidelines are based on common standards for greywater reuse. Actual requirements may vary based on local regulations and specific use cases.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Sensor Data Display */}
          <div className="col-lg-12 mb-4">
            <div className={`p-3 rounded shadow-sm ${darkMode ? 'border border-secondary' : 'bg-white'}`} style={{
              backgroundColor: darkMode ? "#2D2D2D" : "",
              boxShadow: darkMode ? "0 0 15px rgba(0, 0, 0, 0.5)" : ""
            }}>
              <h4 className="mb-3" style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                <i className="bi bi-graph-up me-2"></i>
                Sensor Monitoring
              </h4>
              
              {/* Sensor Cards */}
              <div className="row mb-4">
                {Object.entries(sensorData).map(([key, value], index) => {
                  const status = getStatusColor(value, key);
                  return (
                    <div className="col-md-6 col-lg-3" key={index}>
                      <div className={`card mb-3 ${darkMode ? 'border-dark' : ''}`} style={{
                        backgroundColor: darkMode ? "#252525" : "",
                        borderColor: darkMode ? "#3D3D3D" : "",
                        borderRadius: "8px",
                        transition: "transform 0.3s ease",
                        boxShadow: darkMode ? "0 4px 8px rgba(0, 0, 0, 0.2)" : "0 4px 8px rgba(0, 0, 0, 0.1)",
                      }}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="card-title text-capitalize" style={{
                              color: darkMode ? "#E0E0E0" : "#333",
                              fontWeight: "600"
                            }}>
                              {key === "tds" ? "TDS" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </h5>
                            <span className={`badge ${getBadgeBackground(status)}`}>
                              {status === "success" ? "Good" : 
                               status === "warning" ? "Warning" : "Critical"}
                            </span>
                          </div>
                          <p className={`card-text h2 ${getTextColor(status)}`} style={{
                            color: 
                              status === "success" ? (darkMode ? "#4dff4d" : "#198754") :
                              status === "warning" ? (darkMode ? "#ffcc00" : "#ffc107") :
                              status === "danger" ? (darkMode ? "#ff6666" : "#dc3545") : 
                              (darkMode ? "#E0E0E0" : "#333"),
                            fontWeight: "700",
                            marginTop: "10px"
                          }}>
                            {value}
                            <small style={{
                              color: darkMode ? "#A0A0A0" : "#6c757d",
                              fontSize: "0.5em",
                              fontWeight: "400"
                            }}>
                              {key === "humidity" ? "%" : 
                               key === "tds" ? " ppm" : 
                               key === "temperature" ? "°C" : 
                               key === "ph" ? "" :
                               " NTU"}
                            </small>
                          </p>
                          <div className="progress mt-3" style={{height: "8px", backgroundColor: darkMode ? "#444" : "#e9ecef"}}>
                            <div className={`progress-bar bg-${status}`} style={{
                              width: `${key === "ph" ? ((value / 14) * 100) : ((value / 100) * 100)}%`,
                              transition: "width 0.5s ease"
                            }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className={`p-3 rounded ${darkMode ? 'border border-secondary' : 'bg-white'}`} style={{
                    backgroundColor: darkMode ? "#252525" : "",
                    height: "300px"
                  }}>
                    <h5 className="mb-3" style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                      Temperature & Humidity Trends
                    </h5>
                    <Line 
                      options={chartOptions}
                      data={{
                        labels: sensorHistory.timestamps,
                        datasets: [
                          {
                            label: 'Temperature (°C)',
                            data: sensorHistory.temperature,
                            borderColor: '#ff6b6b',
                            backgroundColor: '#ff6b6b20',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'Humidity (%)',
                            data: sensorHistory.humidity,
                            borderColor: '#4ecdc4',
                            backgroundColor: '#4ecdc420',
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className={`p-3 rounded ${darkMode ? 'border border-secondary' : 'bg-white'}`} style={{
                    backgroundColor: darkMode ? "#252525" : "",
                    height: "300px"
                  }}>
                    <h5 className="mb-3" style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                      Water Quality Parameters
                    </h5>
                    <Line 
                      options={chartOptions}
                      data={{
                        labels: sensorHistory.timestamps,
                        datasets: [
                          {
                            label: 'TDS (ppm)',
                            data: sensorHistory.tds,
                            borderColor: '#45b7d1',
                            backgroundColor: '#45b7d120',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'Turbidity (NTU)',
                            data: sensorHistory.turbidity,
                            borderColor: '#96ceb4',
                            backgroundColor: '#96ceb420',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'pH',
                            data: sensorHistory.ph,
                            borderColor: '#ffeead',
                            backgroundColor: '#ffeead20',
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conversation History */}
          <div className="col-lg-12">
            <div className={`p-3 rounded shadow-sm mb-4 ${darkMode ? 'border border-secondary' : 'bg-white'}`} style={{
              backgroundColor: darkMode ? "#2D2D2D" : "",
              boxShadow: darkMode ? "0 0 15px rgba(0, 0, 0, 0.5)" : ""
            }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                  <i className="bi bi-chat-dots me-2"></i>
                  Conversation
                </h4>
                {conversation.length > 0 && (
                  <button 
                    className={`btn btn-sm ${darkMode ? 'btn-outline-danger' : 'btn-outline-danger'}`}
                    onClick={clearConversation}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Clear History
                  </button>
                )}
              </div>
              <div 
                className={`p-3 mb-3 rounded ${darkMode ? '' : 'bg-light'}`} 
                style={{
                  maxHeight: "300px", 
                  overflowY: "auto",
                  backgroundColor: darkMode ? "#1E1E1E" : "",
                  scrollbarWidth: "thin",
                  scrollbarColor: darkMode ? "#666 #1E1E1E" : ""
                }}
              >
                {conversation.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-dots" style={{fontSize: "2rem", color: darkMode ? "#A0A0A0" : "#6c757d"}}></i>
                    <p className="mt-2" style={{color: darkMode ? "#A0A0A0" : "#6c757d"}}>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  conversation.map((msg, idx) => (
                    <div key={idx} className={`mb-3 ${msg.role === "user" ? "text-end" : ""}`}>
                      <div 
                        className={`d-inline-block p-3 rounded-3 ${
                          msg.role === "user" 
                            ? (darkMode ? 'bg-info bg-opacity-75 text-white' : 'bg-primary bg-opacity-75 text-white') 
                            : (darkMode ? 'bg-dark border border-secondary' : 'bg-white border')
                        }`}
                        style={{
                          maxWidth: "80%", 
                          textAlign: "left",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                          backgroundColor: msg.role === "user" 
                            ? (darkMode ? "#0d6efd" : "") 
                            : (darkMode ? "#2D2D2D" : "")
                        }}
                      >
                        <strong style={{
                          color: msg.role === "user" 
                            ? "#ffffff" 
                            : (darkMode ? "#50C8FF" : "#0d6efd")
                        }}>
                          {msg.role === "user" ? "You" : "OpenAI Assistant"}
                        </strong>
                        <p className="mb-0 mt-1">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Chatbot Input */}
              <div className="input-group">
                <textarea
                  className={`form-control ${darkMode ? 'bg-dark text-light border-secondary' : ''}`}
                  placeholder="Ask something about your sensor data or water quality..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={3}
                  style={{
                    backgroundColor: darkMode ? "#1A1A1A" : "",
                    border: darkMode ? "1px solid #444" : "",
                    borderRadius: "6px",
                    resize: "none"
                  }}
                />
                <button 
                  className={`btn ${darkMode ? 'btn-info text-white' : 'btn-primary'}`} 
                  onClick={handleSend} 
                  disabled={loading}
                  style={{
                    minWidth: "100px",
                    fontWeight: "600"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-1"></i>
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Response Details */}
            {responseText || errorList.length > 0 || codeBlocks.length > 0 ? (
              <div className={`p-3 rounded shadow-sm mb-4 ${darkMode ? 'border border-secondary' : 'bg-white'}`} style={{
                backgroundColor: darkMode ? "#2D2D2D" : "",
                boxShadow: darkMode ? "0 0 15px rgba(0, 0, 0, 0.5)" : ""
              }}>
                <h4 style={{color: darkMode ? "#50C8FF" : "#0d6efd"}}>
                  <i className="bi bi-file-earmark-code me-2"></i>
                  Response Details
                </h4>
                
                {errorList.length > 0 && (
                  <div className="mt-3">
                    <h5 style={{color: darkMode ? "#ff6666" : "#dc3545"}}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Identified Issues:
                    </h5>
                    <ul className="list-group">
                      {errorList.map((error, index) => (
                        <li key={index} className={`list-group-item ${darkMode ? 'bg-dark text-danger border-secondary' : 'text-danger'}`} style={{
                          backgroundColor: darkMode ? "#252525" : "",
                          color: darkMode ? "#ff6666" : ""
                        }}>
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {codeBlocks.length > 0 && (
                  <div className="mt-3">
                    <h5 style={{color: darkMode ? "#E0E0E0" : "#333"}}>
                      <i className="bi bi-code-square me-2"></i>
                      Generated Code:
                    </h5>
                    {codeBlocks.map((block, index) => (
                      <div key={index} className="position-relative mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{
                          backgroundColor: darkMode ? "#333" : "#f8f9fa",
                          padding: "8px 12px",
                          borderTopLeftRadius: "6px",
                          borderTopRightRadius: "6px",
                        }}>
                          <span className="badge bg-secondary">{block.language}</span>
                          <button 
                            className={`btn btn-sm ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                            onClick={() => {
                              navigator.clipboard.writeText(block.code);
                              alert("Code copied to clipboard!");
                            }}
                          >
                            <i className="bi bi-clipboard me-1"></i>
                            Copy
                          </button>
                        </div>
                        <SyntaxHighlighter 
                          language={block.language} 
                          style={darcula} 
                          className="rounded-bottom"
                          customStyle={{
                            margin: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0
                          }}
                        >
                          {block.code}
                        </SyntaxHighlighter>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;