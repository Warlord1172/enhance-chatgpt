// Importing the necessary dependencies and styles
import CodeBlock from "./codeblock";
import "./App.css";
import "./normal.css";
import { Modal, Button } from "react-bootstrap";
import CustomIcon from './chatgptAvatar.js';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { useState, useEffect } from "react"; // React's built-in hooks
import Alert from "react-bootstrap/Alert"; // Bootstrap Alert for error messages
import { GoogleLogin} from "react-google-login";
import ChatThreadList from "./ChatThreadList";

const clientId = "803137367147-ju4cmttatlrl6q9928mg4bgs3rdo2au3.apps.googleusercontent.com"; // Replace with your actual Client ID

// Main application component
function App() {
  // Runs once after initial render to get AI model engines
  useEffect(() => {
    getEngines();
  });
  // Various state variables
  const [showModal, setShowModal] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Google sign in
  const [systemMessage, setSystemMessage] = useState(
    "You are a helpful assistant."
  ); // Default System message
  const [conversationHistory, setConversationHistory] = useState([]); // Conversation History
  const [currentThreadId, setCurrentThreadId] = useState(0); // Current thread ID
  const [errorMessage, setErrorMessage] = useState(""); // Error message
  const [showError, setShowError] = useState(false); // Flag for showing error
  const [input, setInput] = useState(""); // Current input
  const [Models, setModels] = useState([{ id: "Loading...", ready: false }]); // AI models
  const [currentModel, setCurrentModel] = useState("gpt-3.5-turbo"); // Selected AI model
  const [updatedSystemMessage, setUpdatedSystemMessage] = useState(false); //set System role
  const [submitConfirm, setSubmitConfirm] = useState("");

  // Default chat log
  const [chatLog, setChatLog] = useState([
    {
      user: "gpt",
      message: "How can i help you today?",
    },
  ]);
  // Default chat threads
  const [chatThreads, setChatThreads] = useState([
    {
      id: 0,
      title: "Chat Room 1",
      chatLog: [
        {
          user: "gpt",
          message: "How can i help you today?",
        },
      ],
    },
  ]);

  // Google sign in feature
  const handleLoginSuccess = (response) => {
    console.log("Login Success", response);
    setIsLoggedIn(true);
    // Additional logic for handling successful login
  };

  const handleLoginFailure = (response) => {
    console.log("Login Failure", response);
    // Additional logic for handling failed login
  };

  // Runs whenever current thread ID or chat threads change
  useEffect(() => {
    const currentThread = chatThreads.find(
      (thread) => thread.id === currentThreadId
    );
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
        title: `Chat Room ${chatThreads.length + 1}`,
        chatLog: [
          {
            user: "gpt",
            message: "How can I help you today?",
          },
        ],
      },
    ]);
  }
  // Function to remove a chat thread
  function removeThread(threadId) {
    setChatThreads((prevThreads) =>
      prevThreads.filter((thread) => thread.id !== threadId)
    );
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
      setShowError(true);
      setErrorMessage(`An error has occurred, Please reload the Window`);
    } else {
      setShowError(false);
    }
  }, [errorMessage]);

  // Runs when models state changes
  useEffect(() => {
    console.log("Models state changed:", Models);
  }, [Models]);

  // Runs when system role changes
  useEffect(() => {
    setUpdatedSystemMessage(false);
  }, [systemMessage]);
  // Function to handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    let chatLogNew = [...chatLog, { user: "me", message: `${input}` }];
    console.log("input:", input); // Log the input value
    setInput("");
    const messages = chatLogNew.map((entry) => ({
      role: entry.user === "me" ? "user" : "assistant",
      content: entry.message,
    }));
    console.log("messages:", messages); // Log the prepared messages array
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
          systemRole: "system",
          systemMessage: systemMessage,
          updatedSystemMessage: updatedSystemMessage,
          conversationHistory: messages, // send the prepared messages array
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Raw response:", data); // Log the raw response data
      // Check if the response includes a codeBlocks array
      if (data.codeBlocks) {
        // Iterate over each code block and add it to the chatLog
        data.codeBlocks.forEach((codeBlock) => {
          // Extract the language and code from the code block
          const { language, code } = codeBlock;
          // Add a codeBlock object to the chatLog instead of a regular message
          chatLogNew = [
            ...chatLogNew,
            { user: "gpt", codeBlocks: { language, code } },
            { user: "gpt", message: `${data.message}` },
          ];
        });
        console.log("chatLogNew with code block:", chatLogNew);
      } else {
        // If no codeBlocks, add the message as is
        chatLogNew = [
          ...chatLogNew,
          { user: "gpt", message: `${data.message}` },
        ];
        console.log("chatLogNew without code block:", chatLogNew);
      }

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
      console.error("An error occurred:", error); // Log any errors
      setErrorMessage(`Sorry, an error occurred: ${error.message}`);
    }
  }
  // Function to resize the window
  useEffect(() => {
    const setWindowSize = () => {
      const windowWidth = window.innerWidth * 0.8; // 80% of the browser window width
      const windowHeight = window.innerHeight * 0.8; // 80% of the browser window height
      window.resizeTo(windowWidth, windowHeight);
    };

    setWindowSize();
    window.addEventListener("resize", setWindowSize);

    return () => {
      window.removeEventListener("resize", setWindowSize);
    };
  }, []);
  useEffect(() => {
    const setWindowZoom = () => {
      document.documentElement.style.zoom = "80%";
    };

    setWindowZoom();
  }, []);

  // Function to handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
  };
  // Render the application
  return (
    <div className="App">
      {/* Other parts of your application */}
      {/* Modal for introduction and login options */}
<Modal show={showModal} onHide={handleCloseModal} backdrop="static">
  <Modal.Header closeButton>
    <Modal.Title>Welcome to the Application</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <p>Introduction text goes here...</p>
  </Modal.Body>
  <Modal.Footer>
    <GoogleLogin
      clientId={clientId}
      onSuccess={handleLoginSuccess}
      onFailure={handleLoginFailure}
      cookiePolicy={"single_host_origin"}
      render={(renderProps) => (
        <button
          className="Google-Signin"
          onClick={renderProps.onClick}
          disabled={renderProps.disabled}
        >
          <img
            src="/google.png"
            alt="Google Logo"
            className="google-logo"
          />
          {isLoggedIn ? "Logout" : "Login with Google"}
        </button>
      )}
    />
    <Button variant="secondary" onClick={handleCloseModal}>
      Continue as Guest
    </Button>
  </Modal.Footer>
</Modal>

      {/* Other parts of your application */}
      <Alert
        className="Alert-Notif"
        variant="danger"
        show={showError}
        onClose={() => setShowError(false)}
        dismissible
      >
        <Alert.Heading>Error</Alert.Heading>
        <p>{errorMessage}</p>
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
              className="Model-list"
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
            <label>Content: </label>
            <textarea
              placeholder={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              console.log(systemMessage);
              setUpdatedSystemMessage(true);
              setSubmitConfirm("Changes have been submitted");
            }}
            className="System-Submit-Button"
          >
            Update System Message
          </button>

          <div className="confirm-msg">
            {updatedSystemMessage && submitConfirm}
          </div>
        </div>
        <ChatThreadList
          threads={chatThreads}
          activeThreadId={currentThreadId}
          onSelectThread={(id) => setCurrentThreadId(id)}
          onRemoveThread={removeThread}
        />
        <GoogleLogin
          clientId={clientId}
          onSuccess={handleLoginSuccess}
          onFailure={handleLoginFailure}
          cookiePolicy={"single_host_origin"}
          render={(renderProps) => (
            <button
              className="Google-Signin"
              onClick={renderProps.onClick}
              disabled={renderProps.disabled}
            >
              <img
                src="/google.png"
                alt="Google Logo"
                className="google-logo"
              />
              {isLoggedIn ? "Logout" : "Login with Google"}
            </button>
          )}
        />
      </aside>
      <section className="chatbox">
        <div className="chat-log">
          {chatLog.map((message, index) => {
            if (message.codeBlocks) {
              return (
                <CodeBlock
                  key={index}
                  code={message.codeBlocks.code}
                  language={message.codeBlocks.language}
                />
              );
            } else {
              return <ChatMessage key={index} message={message} />;
            }
          })}
        </div>
        <div className="chat-input-holder">
          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows="1"
              className="chat-input-textarea"
              placeholder="Insert Text Here..."
            ></input>
          </form>
        </div>
      </section>
    </div>
  );
}
// ChatMessage component: displays a single chat message
// It takes a message (object containing the message data) as a prop
const ChatMessage = ({ message }) => {
  console.log('ChatMessage message:', message);
    if (message.codeBlocks) {
      console.log("codeBlocks is present")
      return (
        <div className={`chat-message ${message.user === "gpt" && "chatgpt"}`}>
          <div className="chat-message-center">
            <div className={`avatar ${message.user === "gpt" && "chatgpt"}`}>
              {message.user === "gpt" && (
              <CustomIcon/>
              )}
            </div>
            <div className="message">
              <ReactMarkdown>{message.message}</ReactMarkdown>
            </div>
            {/* Use the CodeBlock component here */}
          <CodeBlock code={message.codeBlocks.code} language={message.codeBlocks.language} />
          </div>
        </div>
      );
    } else if (message.message) {
      console.log("codeBlocks is not present")

      return (
        <div className={`chat-message ${message.user === "gpt" && "chatgpt"}`}>
          <div className="chat-message-center">
            <div className={`avatar ${message.user === "gpt" && "chatgpt"}`}>
            {message.user === "gpt" && (
              <CustomIcon/>
              )}
            </div>
            <div className="message">
              <ReactMarkdown>{message.message}</ReactMarkdown>
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
};
export default App;

