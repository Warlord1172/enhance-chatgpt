// Importing the necessary dependencies and styles
import logo from "./logo.svg";
import "./App.css";
import "./normal.css";
import { useState, useEffect } from "react"; // React's built-in hooks
import Alert from 'react-bootstrap/Alert'; // Bootstrap Alert for error messages

// Main application component
function App() {
  // Runs once after initial render to get AI model engines
  useEffect(() => {
    getEngines();
  }, []);
  // Various state variables
  const [systemRole, setSystemRole] = useState("system"); //
  const [systemMessage, setSystemMessage] = useState("You are a helpful assistant."); //
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(0); // Current thread ID
  const [errorMessage, setErrorMessage] = useState(""); // Error message
  const [showError, setShowError] = useState(false); // Flag for showing error
  const [input, setInput] = useState(""); // Current input
  const [Models, setModels] = useState([{ id: "Loading...", ready: false }]); // AI models
  const [currentModel, setCurrentModel] = useState("gpt-3.5-turbo"); // Selected AI model
  const [updatedSystemMessage, setUpdatedSystemMessage] = useState(false);

  // Default chat log
  const [chatLog, setChatLog] = useState([
    {
      user: "gpt",
      message: "How can i help you today?",
    }
  ]);
  // Default chat threads
  const [chatThreads, setChatThreads] = useState([{
    id: 0,
    title: 'Chat 1',
    chatLog: [{
      user: "gpt",
      message: "How can i help you today?",
    }],
  }]);

   // Runs whenever current thread ID or chat threads change
  useEffect(() => {
    const currentThread = chatThreads.find(thread => thread.id === currentThreadId);
    if (currentThread) {
      setChatLog(currentThread.chatLog);
    }
  }, [currentThreadId, chatThreads]);
  
  // Function to clear chat
  function clearChat() {
    setChatThreads([
      ...chatThreads, 
      {
        id: chatThreads.length,
        title: `Chat ${chatThreads.length + 1}`,
        chatLog: [{
          user: "gpt",
          message: "How can I help you today?",
        }],
      }
    ]);
  }
  
  
  // Function to get AI model engines from the backend
  async function getEngines() {
    console.log("getEngines called");
    fetch("http://localhost:3080/models")
      .then((res) => res.json())
      .then((data) => {
        console.log("Received data from the backend:", data);
        if (data.data.length === 0) {
          setModels([{ id: "No models available", ready: false }]);
        } else {
          setModels(data.data);
        }
        console.log("Models state updated:", Models);
      })
      .catch((error) => {
        console.error("Error fetching models:", error); // Add this line to catch errors
      });
  }
  // Runs when error message changes
  useEffect(() => {
    if (errorMessage) {
      alert(errorMessage);
      setErrorMessage("");
    }
  }, [errorMessage]);
  // Runs when error message changes
  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
    }
  }, [errorMessage]);

  // Runs when models state changes
  useEffect(() => {
    console.log("Models state changed:", Models);
  }, [Models]);

  // Runs when system role changes
  useEffect(() => {
  setUpdatedSystemMessage(true);
  }, [systemRole, systemMessage]);
  // Function to handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    let chatLogNew = [...chatLog, { user: "me", message: `${input}` }];
    setInput("");

    const messages = chatLogNew.map((entry) => ({
      role: entry.user === "me" ? "user" : "assistant",
      content: entry.message, 
    }));

    setConversationHistory((prevHistory) => [
      ...prevHistory,
      {
        role: "user",
        content: input,
      },
    ]);

    if (conversationHistory.length > 5) {
      setConversationHistory((prevHistory) => prevHistory.slice(1));
    }

    try {
      const response = await fetch("http://localhost:3080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          currentModel: currentModel,
          isChatModel: currentModel.startsWith("gpt-"),
          systemRole: systemRole,
          systemMessage: systemMessage,
          updatedSystemMessage: updatedSystemMessage,
          conversationHistory: messages // send the prepared messages array
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Raw response:", data);
      chatLogNew = [...chatLogNew, { user: "gpt", message: `${data.message}` }];
      setChatLog(chatLogNew);
      setChatThreads(
        chatThreads.map((thread) => {
          if (thread.id !== currentThreadId) return thread;
          return {
            ...thread,
            chatLog: chatLogNew,
          };
        })
      );
      setUpdatedSystemMessage(false);
    } catch (error) {
      console.error("An error occurred:", error);
      setErrorMessage(`Sorry, an error occurred: ${error.message}`);
    }
}


   // Render the application
  return (
    <div className="App">
      {/* Other parts of your application */}
      <Alert
        variant="danger"
        show={showError}
        onClose={() => setShowError(false)}
        dismissible
      >
        {errorMessage}
      </Alert>
      <aside className="sidemenu">
        <div className="side-menu-button" onClick={clearChat}>
          <span>+</span>
          New Chat
        </div>
        <header className="model-header">
          <p>
            Selected Model:{" "}
            <span style={{ color: "green" }}>{currentModel}</span>
          </p>
        </header>
        <div className="models">
          {Models.length > 0 ? (
            <select
              onChange={(e) => {
                console.log("setting to..", e.target.value);
                setCurrentModel(e.target.value);
              }}
            >
              {Models.map((model) => (
                <option key={model.id} value={model.id} disabled={!model.ready}>
                  {model.id}
                </option>
              ))}
            </select>
          ) : (
            <p>Loading models...</p>
          )}
        </div>
        <div className="system-message-settings">
    <p>System Message Settings</p>
    <div>
      <label>Role: </label>
      <input
        type="text"
        value={systemRole}
        onChange={(e) => setSystemRole(e.target.value)}
      />
    </div>
    <div>
      <label>Content: </label>
      <textarea
        value={systemMessage}
        onChange={(e) => setSystemMessage(e.target.value)}
      />
    </div>
    <button onClick={() => setUpdatedSystemMessage(true)} className="System-Submit-Button">Update System Message</button>
  </div>
        <ChatThreadList
          threads={chatThreads}
          activeThreadId={currentThreadId}
          onSelectThread={(id) => setCurrentThreadId(id)}
        />
      </aside>
      <section className="chatbox">
        <div className="chat-log">
          {chatLog.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </div>
        <div className="chat-input-holder">
          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows="1"
              className="chat-input-textarea"
            ></input>
          </form>
        </div>
      </section>
    </div>
  );
}
// ChatThreadList component: displays a list of chat threads
// It takes threads (array of thread data), activeThreadId (id of the currently active thread), 
// and onSelectThread (function to handle when a thread is selected) as props
function ChatThreadList({ threads, activeThreadId, onSelectThread }) {
  return (
    <div className="chat-thread-list">
      {/* For each thread, create a div with a click handler that calls onSelectThread with the id of the thread */}
      {threads.map(thread => (
        <div
          key={thread.id}
          className={`chat-thread-title ${thread.id === activeThreadId ? 'active' : ''}`}
          onClick={() => onSelectThread(thread.id)}
        >
          {thread.title}
        </div>
      ))}
    </div>
  );
}

// ChatMessage component: displays a single chat message
// It takes a message (object containing the message data) as a prop
const ChatMessage = ({ message }) => {
  return (
    // Create a div with a conditional class based on whether the message was sent by the assistant
    <div className={`chat-message ${message.user === "gpt" && "chatgpt"}`}>
      <div className="chat-message-center">
        <div className={`avatar ${message.user === "gpt" && "chatgpt"}`}>
          {message.user === "gpt" && (
            // SVG file that serves as Avatar Image
            <svg
              width={41}
              height={41}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth={1.5}
              className="h-6 w-6"
            >
              <path
                d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813ZM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496ZM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744ZM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237Zm27.658 6.437-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132Zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763Zm-21.063 6.929-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225Zm1.829-3.943 4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
        <div className="message">{message.message}</div>
      </div>
    </div>
  );
};

export default App;
